import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, X, FileText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { MemberName } from '../../../components/MemberName';

export default function MessageThread() {
  const router = useRouter();
  const { id, recipientId } = useLocalSearchParams<{ id: string; recipientId?: string }>();
  const { user, neighborhoodId, handleAuthError } = useAuth();
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState<any>(null);
  const [recipient, setRecipient] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(id === 'new' ? null : id);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (id === 'new' && recipientId) {
      fetchRecipient(recipientId);
      setLoading(false);
    } else if (id && id !== 'new') {
      fetchMessages();
    }
  }, [id, recipientId]);

  const fetchRecipient = async (uid: string) => {
    try {
      const { data, error } = await insforge.database
        .from('user_profiles')
        .select('user_id, full_name, avatar_url, is_visible, anonymous_id')
        .eq('user_id', uid)
        .single();
      
      if (error) throw error;
      setRecipient(data);
    } catch (err) {
      console.error('Error fetching recipient:', err);
    }
  };

  const fetchMessages = async () => {
    if (!id || id === 'new') return;
    setLoading(true);
    try {
      // 1. Fetch messages
      const { data: msgs, error: msgsError } = await insforge.database
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;
      setMessages(msgs || []);

      // 2. Fetch recipient info from conversation
      const { data: conv, error: convError } = await insforge.database
        .from('conversations')
        .select(`
            participant_1:user_profiles!participant_1_id(user_id, full_name, avatar_url, is_visible, anonymous_id),
            participant_2:user_profiles!participant_2_id(user_id, full_name, avatar_url, is_visible, anonymous_id)
        `)
        .eq('id', id)
        .single();
      
      if (convError) throw convError;
      const otherParticipant = conv.participant_1.user_id === user?.id ? conv.participant_2 : conv.participant_1;
      setRecipient(otherParticipant);

      // 3. Mark unread messages as read (optional MVP)
    } catch (err) {
      console.error('Error fetching messages:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAttachment({
        uri: result.assets[0].uri,
        type: 'image',
        name: result.assets[0].fileName || `image-${Date.now()}.jpg`
      });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });

    if (!result.canceled) {
      setAttachment({
        uri: result.assets[0].uri,
        type: 'document',
        name: result.assets[0].name
      });
    }
  };

  const uploadAttachment = async () => {
    if (!attachment) return null;

    try {
      const fileResponse = await fetch(attachment.uri);
      const blob = await fileResponse.blob();
      const ext = attachment.name.split('.').pop();
      const fileKey = `${user?.id}/${Date.now()}.${ext}`;

      const { data, error } = await insforge.storage
        .from('message-attachments')
        .upload(fileKey, blob);

      if (error) throw error;
      return data?.url;
    } catch (err) {
      console.error('Upload error:', err);
      throw new Error('Failed to upload attachment');
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && !attachment) return;
    if (!user || !neighborhoodId) return;

    setSending(true);
    try {
      // 1. Check daily limit (this is also enforced by RLS but good to check UI side)
      const { data: usage, error: usageError } = await insforge.database
        .from('user_daily_usage')
        .select('messages_sent_count')
        .eq('user_id', user.id)
        .eq('usage_date', new Date().toISOString().split('T')[0])
        .single();
      
      if (!usageError && usage && usage.messages_sent_count >= 10) {
        showToast('Daily message limit reached (10/day)', 'error');
        setSending(false);
        return;
      }

      // 2. Ensure conversation exists
      let currentConvId = conversationId;
      if (!currentConvId && recipientId) {
        // Create new conversation
        const p1 = user.id < recipientId ? user.id : recipientId;
        const p2 = user.id < recipientId ? recipientId : user.id;

        const { data: newConv, error: convError } = await insforge.database
          .from('conversations')
          .insert([{
            participant_1_id: p1,
            participant_2_id: p2,
            neighborhood_id: neighborhoodId
          }])
          .select()
          .single();
        
        if (convError) throw convError;
        currentConvId = newConv.id;
        setConversationId(currentConvId);
      }

      if (!currentConvId) throw new Error('Failed to identify conversation');

      // 3. Upload attachment if exists
      const attachmentUrl = await uploadAttachment();

      // 4. Send message
      const { data: newMessage, error: sendError } = await insforge.database
        .from('messages')
        .insert([{
          conversation_id: currentConvId,
          sender_id: user.id,
          neighborhood_id: neighborhoodId,
          content: messageText.trim(),
          attachment_url: attachmentUrl,
          attachment_type: attachment?.type
        }])
        .select()
        .single();

      if (sendError) throw sendError;

      // 5. Update local state
      setMessages([...messages, newMessage]);
      setMessageText('');
      setAttachment(null);
      
      // If it was a new conversation, update route so back button works correctly
      if (id === 'new') {
          router.setParams({ id: currentConvId });
      }

    } catch (err: any) {
      console.error('Send error:', err);
      if (err.message?.includes('messages_sent_count')) {
          showToast('Daily message limit reached (10/day)', 'error');
      } else {
          showToast(err.message || 'Failed to send message', 'error');
      }
      handleAuthError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {recipient && (
            <>
              <MemberName 
                name={recipient.full_name} 
                isVisible={recipient.is_visible} 
                anonymousId={recipient.anonymous_id}
                textStyle={styles.headerTitle}
              />
              <Text style={styles.headerSubtitle}>Neighbor</Text>
            </>
          )}
        </View>
        <View style={styles.iconButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1193d4" />
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.startConversation}>
              <MessageSquare size={48} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={styles.startTitle}>No messages yet</Text>
              <Text style={styles.startText}>Send your first message to start the conversation.</Text>
            </View>
          ) : (
            messages.map((msg) => (
              <View 
                key={msg.id} 
                style={[
                  styles.messageWrapper, 
                  msg.sender_id === user?.id ? styles.myMessageWrapper : styles.theirMessageWrapper
                ]}
              >
                <View 
                  style={[
                    styles.messageBubble,
                    msg.sender_id === user?.id ? styles.myBubble : styles.theirBubble
                  ]}
                >
                  {msg.attachment_url && (
                    <TouchableOpacity 
                      style={styles.attachmentPreview}
                      onPress={() => Alert.alert('Open Attachment', 'Attachment viewing is not implemented in MVP')}
                    >
                      {msg.attachment_type === 'image' ? (
                        <Image source={{ uri: msg.attachment_url }} style={styles.bubbleImage} />
                      ) : (
                        <View style={styles.bubbleFile}>
                          <FileText size={24} color="#64748b" />
                          <Text style={styles.bubbleFileText} numberOfLines={1}>Document</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  {msg.content ? (
                    <Text style={[
                      styles.messageText,
                      msg.sender_id === user?.id ? styles.myMessageText : styles.theirMessageText
                    ]}>
                      {msg.content}
                    </Text>
                  ) : null}
                  <Text style={[
                    styles.messageTime,
                    msg.sender_id === user?.id ? styles.myTime : styles.theirTime
                  ]}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Input Area */}
      <View style={styles.inputBar}>
        {attachment && (
          <View style={styles.attachmentIndicator}>
            <View style={styles.attachmentNameContainer}>
              {attachment.type === 'image' ? <ImageIcon size={16} color="#1193d4" /> : <FileText size={16} color="#1193d4" />}
              <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachmentIconButton} onPress={pickImage}>
            <ImageIcon size={24} color="#64748b" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentIconButton} onPress={pickDocument}>
            <Paperclip size={24} color="#64748b" strokeWidth={2} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (!messageText.trim() && !attachment) || sending ? styles.sendButtonDisabled : null
            ]} 
            onPress={handleSend}
            disabled={(!messageText.trim() && !attachment) || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={20} color="#ffffff" strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  headerSubtitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#1193d4',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#1e293b',
  },
  messageTime: {
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTime: {
    color: '#94a3b8',
  },
  attachmentPreview: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: 200,
    height: 150,
    resizeMode: 'cover',
  },
  bubbleFile: {
    width: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },
  bubbleFileText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  startConversation: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 12,
  },
  startTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#1e293b',
  },
  startText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  inputBar: {
    backgroundColor: '#ffffff',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  attachmentName: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#1193d4',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachmentIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});
