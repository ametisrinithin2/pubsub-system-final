/**
 * PubSub Frontend - Minimal UI for testing backend
 * 
 * Features:
 * - Subscribe to control-topics for topic management events
 * - Subscribe to topic channels for messages
 * - Create/delete topics
 * - Publish messages
 * - Live message feed
 */

import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';

export default function Home() {
  // State management
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [publishPayload, setPublishPayload] = useState('{"example": "data"}');
  const [controlEvents, setControlEvents] = useState([]);
  const [pusherStatus, setpusherStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  
  // Refs for Pusher instances
  const pusherRef = useRef(null);
  const controlChannelRef = useRef(null);
  const topicChannelsRef = useRef({});

  // Initialize Pusher and subscribe to control channel
  useEffect(() => {
    // Check if Pusher credentials are configured
    const pusherKey = "389fa24406146c35e15b";
    const pusherCluster = "ap2";

    if (!pusherKey || !pusherCluster) {
      setError('Pusher credentials not configured. Set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER in .env.local');
      return;
    }

    // Initialize Pusher
    console.log('Initializing Pusher...');
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true
    });

    pusher.connection.bind('connected', () => {
      console.log('✓ Pusher connected');
      setpusherStatus('Connected');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('✗ Pusher disconnected');
      setpusherStatus('Disconnected');
    });

    pusher.connection.bind('error', (err) => {
      console.error('Pusher connection error:', err);
      setError('Pusher connection error: ' + err.message);
    });

    pusherRef.current = pusher;

    // Subscribe to control channel for topic management
    const controlChannel = pusher.subscribe('control-topics');

    controlChannel.bind('topic_created', (data) => {
      console.log('🎉 Topic created:', data);
      setControlEvents(prev => [...prev, { type: 'created', ...data }]);
      
      // Add to topic list if not already present
      setTopics(prev => {
        if (!prev.find(t => t.name === data.topic)) {
          return [...prev, { name: data.topic, subscribers: 0 }];
        }
        return prev;
      });
    });

    controlChannel.bind('topic_deleted', (data) => {
      console.log('🗑️  Topic deleted:', data);
      setControlEvents(prev => [...prev, { type: 'deleted', ...data }]);
      
      // Remove from topic list
      setTopics(prev => prev.filter(t => t.name !== data.topic));
      
      // Unsubscribe from topic channel if subscribed
      if (topicChannelsRef.current[data.topic]) {
        pusher.unsubscribe(`topic-${data.topic}`);
        delete topicChannelsRef.current[data.topic];
      }
      
      // Clear selection if deleted topic was selected
      if (selectedTopic === data.topic) {
        setSelectedTopic('');
      }
    });

    controlChannelRef.current = controlChannel;

    // Fetch initial topics
    fetchTopics();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up Pusher connections...');
      controlChannel.unbind_all();
      pusher.unsubscribe('control-topics');
      
      // Unsubscribe from all topic channels
      Object.keys(topicChannelsRef.current).forEach(topic => {
        pusher.unsubscribe(`topic-${topic}`);
      });
      
      pusher.disconnect();
    };
  }, []);

  // Subscribe to topic channel when topic is selected
  useEffect(() => {
    if (!selectedTopic || !pusherRef.current) return;

    const channelName = `topic-${selectedTopic}`;
    
    // Skip if already subscribed
    if (topicChannelsRef.current[selectedTopic]) {
      console.log(`Already subscribed to ${channelName}`);
      return;
    }

    console.log(`Subscribing to ${channelName}...`);
    const topicChannel = pusherRef.current.subscribe(channelName);

    topicChannel.bind('event-message', (data) => {
      console.log(`📨 Message received on ${selectedTopic}:`, data);
      setMessages(prev => [...prev, { 
        topic: selectedTopic,
        ...data,
        receivedAt: new Date().toISOString()
      }]);
    });

    topicChannelsRef.current[selectedTopic] = topicChannel;

    // Fetch message history when subscribing
    fetchHistory(selectedTopic);

    // Cleanup: unsubscribe when topic changes
    return () => {
      if (topicChannelsRef.current[selectedTopic]) {
        console.log(`Unsubscribing from ${channelName}...`);
        topicChannel.unbind_all();
        pusherRef.current.unsubscribe(channelName);
        delete topicChannelsRef.current[selectedTopic];
      }
    };
  }, [selectedTopic]);

  // API Functions
  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/topics');
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
      setError('Failed to fetch topics: ' + err.message);
    }
  };

  const fetchHistory = async (topic) => {
    try {
      const res = await fetch(`/api/history?topic=${topic}&last_n=10`);
      const data = await res.json();
      
      if (data.messages) {
        setMessages(prev => [
          ...data.messages.map(msg => ({
            topic: topic,
            ...msg,
            receivedAt: msg.timestamp,
            isHistory: true
          })),
          ...prev.filter(m => m.topic === topic && !m.isHistory)
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const createTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTopicName.trim() })
      });

      const data = await res.json();
      
      if (res.ok) {
        console.log('✓ Topic created:', data);
        setNewTopicName('');
        setError(null);
        
        // Topic will be added via Pusher event
        // But also refresh to be sure
        setTimeout(fetchTopics, 100);
      } else {
        setError(`Failed to create topic: ${data.message || data.error}`);
      }
    } catch (err) {
      setError('Failed to create topic: ' + err.message);
    }
  };

  const deleteTopic = async (topicName) => {
    if (!confirm(`Delete topic "${topicName}"?`)) return;

    try {
      const res = await fetch(`/api/topics/${topicName}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (res.ok) {
        console.log('✓ Topic deleted:', data);
        setError(null);
        
        // Topic will be removed via Pusher event
        // But also refresh to be sure
        setTimeout(fetchTopics, 100);
      } else {
        setError(`Failed to delete topic: ${data.message || data.error}`);
      }
    } catch (err) {
      setError('Failed to delete topic: ' + err.message);
    }
  };

  const publishMessage = async (e) => {
    e.preventDefault();
    if (!selectedTopic) {
      setError('Please select a topic first');
      return;
    }

    try {
      const payload = JSON.parse(publishPayload);
      
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          message: {
            payload: payload
          }
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        console.log('✓ Message published:', data);
        setError(null);
      } else {
        setError(`Failed to publish: ${data.message || data.error}`);
      }
    } catch (err) {
      setError('Invalid JSON or publish failed: ' + err.message);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearControlEvents = () => {
    setControlEvents([]);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>PubSub System</h1>
        <div style={styles.statusBar}>
          <span style={pusherStatus === 'Connected' ? styles.statusConnected : styles.statusDisconnected}>
            ● {pusherStatus}
          </span>
          <span style={styles.statusInfo}>{topics.length} topics</span>
        </div>
      </header>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
          <button onClick={() => setError(null)} style={styles.closeError}>×</button>
        </div>
      )}

      <div style={styles.mainContent}>
        {/* Left Column: Topic Management */}
        <div style={styles.column}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Create Topic</h2>
            <form onSubmit={createTopic} style={styles.form}>
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Enter topic name..."
                style={styles.input}
              />
              <button type="submit" style={styles.button}>
                Create
              </button>
            </form>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Topics ({topics.length})</h2>
            {topics.length === 0 ? (
              <p style={styles.emptyState}>No topics yet. Create one above!</p>
            ) : (
              <ul style={styles.topicList}>
                {topics.map(topic => (
                  <li
                    key={topic.name}
                    style={{
                      ...styles.topicItem,
                      ...(selectedTopic === topic.name ? styles.topicItemSelected : {})
                    }}
                  >
                    <div style={styles.topicInfo}>
                      <button
                        onClick={() => setSelectedTopic(topic.name)}
                        style={styles.topicButton}
                      >
                        {topic.name}
                      </button>
                      <span style={styles.subscriberCount}>
                        👥 {topic.subscribers}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTopic(topic.name)}
                      style={styles.deleteButton}
                      title="Delete topic"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>
              Control Events
              <button onClick={clearControlEvents} style={styles.clearButton}>Clear</button>
            </h2>
            <div style={styles.eventsList}>
              {controlEvents.length === 0 ? (
                <p style={styles.emptyState}>No events yet</p>
              ) : (
                controlEvents.slice().reverse().map((event, idx) => (
                  <div key={idx} style={styles.eventItem}>
                    <span style={event.type === 'created' ? styles.eventCreated : styles.eventDeleted}>
                      {event.type === 'created' ? '✓' : '✗'}
                    </span>
                    <strong>{event.topic}</strong>
                    <span style={styles.eventTime}>
                      {new Date(event.ts).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Publish & Messages */}
        <div style={styles.column}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>
              Publish Message
              {selectedTopic && <span style={styles.selectedTopic}>→ {selectedTopic}</span>}
            </h2>
            {!selectedTopic ? (
              <p style={styles.emptyState}>Select a topic from the left to publish</p>
            ) : (
              <form onSubmit={publishMessage} style={styles.form}>
                <textarea
                  value={publishPayload}
                  onChange={(e) => setPublishPayload(e.target.value)}
                  placeholder='{"key": "value"}'
                  style={styles.textarea}
                  rows={4}
                />
                <button type="submit" style={styles.buttonPrimary}>
                  Publish to {selectedTopic}
                </button>
              </form>
            )}
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>
              Live Messages
              {selectedTopic && <span style={styles.selectedTopic}>from {selectedTopic}</span>}
              <button onClick={clearMessages} style={styles.clearButton}>Clear</button>
            </h2>
            <div style={styles.messagesList}>
              {!selectedTopic ? (
                <p style={styles.emptyState}>Select a topic to see messages</p>
              ) : messages.filter(m => m.topic === selectedTopic).length === 0 ? (
                <p style={styles.emptyState}>No messages yet. Publish one above!</p>
              ) : (
                messages
                  .filter(m => m.topic === selectedTopic)
                  .slice().reverse()
                  .map((msg, idx) => (
                    <div key={idx} style={styles.messageItem}>
                      <div style={styles.messageHeader}>
                        <code style={styles.messageId}>{msg.id}</code>
                        {msg.isHistory && <span style={styles.historyBadge}>History</span>}
                        <span style={styles.messageTime}>
                          {new Date(msg.receivedAt || msg.ts).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre style={styles.messagePayload}>
                        {JSON.stringify(msg.payload, null, 2)}
                      </pre>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      <footer style={styles.footer}>
        <p>
          Real-time PubSub powered by <strong>Pusher</strong> • 
          Press F12 to see console logs • 
          Open multiple tabs to test real-time sync
        </p>
      </footer>
    </div>
  );
}

// Inline Styles
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#333'
  },
  statusBar: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  statusConnected: {
    color: '#22c55e',
    fontWeight: 'bold'
  },
  statusDisconnected: {
    color: '#ef4444',
    fontWeight: 'bold'
  },
  statusInfo: {
    color: '#666',
    fontSize: '14px'
  },
  error: {
    backgroundColor: '#fee2e2',
    border: '1px solid #ef4444',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    color: '#991b1b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeError: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#991b1b'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  panel: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  panelTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    color: '#333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selectedTopic: {
    fontSize: '14px',
    fontWeight: 'normal',
    color: '#3b82f6',
    marginLeft: '8px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'monospace',
    resize: 'vertical'
  },
  button: {
    padding: '10px 16px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonPrimary: {
    padding: '12px 16px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  clearButton: {
    padding: '4px 12px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  topicList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  topicItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer'
  },
  topicItemSelected: {
    backgroundColor: '#eff6ff',
    borderLeft: '3px solid #3b82f6'
  },
  topicInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  topicButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#333',
    textAlign: 'left',
    fontWeight: '500'
  },
  subscriberCount: {
    fontSize: '12px',
    color: '#666'
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    opacity: 0.6
  },
  emptyState: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px 0'
  },
  eventsList: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '8px'
  },
  eventItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    fontSize: '14px',
    borderBottom: '1px solid #f5f5f5'
  },
  eventCreated: {
    color: '#22c55e',
    fontWeight: 'bold'
  },
  eventDeleted: {
    color: '#ef4444',
    fontWeight: 'bold'
  },
  eventTime: {
    fontSize: '12px',
    color: '#999',
    marginLeft: 'auto'
  },
  messagesList: {
    maxHeight: '500px',
    overflowY: 'auto',
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '8px'
  },
  messageItem: {
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    border: '1px solid #e5e7eb'
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '12px'
  },
  messageId: {
    backgroundColor: '#dbeafe',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '11px',
    fontFamily: 'monospace'
  },
  historyBadge: {
    backgroundColor: '#fbbf24',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  messageTime: {
    color: '#999',
    marginLeft: 'auto'
  },
  messagePayload: {
    backgroundColor: '#fff',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    margin: 0,
    overflow: 'auto',
    fontFamily: 'monospace'
  },
  footer: {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
};
