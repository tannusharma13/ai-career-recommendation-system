import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function Community() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('communities');
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [studyRooms, setStudyRooms] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  useEffect(() => {
    loadCommunities();
    loadMyCommunities();
    loadLeaderboard();
  }, []);

  const loadCommunities = async () => {
    try {
      const response = await API.get('/community/communities');
      setCommunities(response.data);
    } catch (error) {
      console.error('Failed to load communities:', error);
    }
  };

  const loadMyCommunities = async () => {
    try {
      // Get user's communities through member data
      const response = await API.get('/community/communities');
      // Filter communities where user is a member
      const userCommunities = response.data.filter(community =>
        community.members?.some(member => member.user_id === user?.id)
      );
      setMyCommunities(userCommunities);
      if (userCommunities.length > 0) {
        setSelectedCommunity(userCommunities[0]);
      }
    } catch (error) {
      console.error('Failed to load my communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await API.get('/community/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const loadForumPosts = async (communityId) => {
    try {
      const response = await API.get(`/community/forums/${communityId}`);
      setForumPosts(response.data);
    } catch (error) {
      console.error('Failed to load forum posts:', error);
    }
  };

  const loadMessages = async (communityId) => {
    try {
      const response = await API.get('/community/messages', {
        params: { community_id: communityId }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadStudyRooms = async (communityId) => {
    try {
      const response = await API.get('/community/study-rooms', {
        params: { community_id: communityId }
      });
      setStudyRooms(response.data);
    } catch (error) {
      console.error('Failed to load study rooms:', error);
    }
  };

  const loadChallenges = async (communityId) => {
    try {
      const response = await API.get('/community/challenges', {
        params: { community_id: communityId }
      });
      setChallenges(response.data);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    }
  };

  const joinCommunity = async (communityId) => {
    try {
      await API.post(`/community/communities/${communityId}/join`);
      loadMyCommunities();
      loadCommunities();
    } catch (error) {
      alert('Failed to join community: ' + error.message);
    }
  };

  const leaveCommunity = async (communityId) => {
    try {
      await API.post(`/community/communities/${communityId}/leave`);
      loadMyCommunities();
      loadCommunities();
    } catch (error) {
      alert('Failed to leave community: ' + error.message);
    }
  };

  const sendMessage = async (content, communityId) => {
    try {
      await API.post('/community/messages', {
        content,
        community_id: communityId
      });
      loadMessages(communityId);
    } catch (error) {
      alert('Failed to send message: ' + error.message);
    }
  };

  const createForumPost = async (title, content, communityId) => {
    try {
      await API.post('/community/forums/posts', {
        title,
        content,
        community_id: communityId
      });
      loadForumPosts(communityId);
    } catch (error) {
      alert('Failed to create post: ' + error.message);
    }
  };

  const createStudyRoom = async (name, description, communityId) => {
    try {
      await API.post('/community/study-rooms', {
        name,
        description,
        community_id: communityId
      });
      loadStudyRooms(communityId);
    } catch (error) {
      alert('Failed to create study room: ' + error.message);
    }
  };

  const tabs = [
    { id: 'communities', label: 'My Communities', icon: '👥' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'forums', label: 'Discussion Forums', icon: '🗣️' },
    { id: 'study-rooms', label: 'Study Rooms', icon: '📚' },
    { id: 'challenges', label: 'Challenges', icon: '🏆' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🥇' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>Loading Community...</div>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>
          👥 Community Hub
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: '16px' }}>
          Connect, learn, and grow with fellow professionals in your career path
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg2)',
              color: activeTab === tab.id ? 'white' : 'var(--text2)',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Communities Tab */}
      {activeTab === 'communities' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {myCommunities.map(community => (
              <div key={community._id} style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>
                  {community.icon || '👥'}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  {community.name}
                </h3>
                <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '12px' }}>
                  {community.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {community.member_count} members
                  </span>
                  <button
                    onClick={() => setSelectedCommunity(community)}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Browse All Communities */}
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
              Discover More Communities
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {communities.filter(c => !myCommunities.some(mc => mc._id === c._id)).map(community => (
                <div key={community._id} style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>
                    {community.icon || '👥'}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    {community.name}
                  </h3>
                  <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '12px' }}>
                    {community.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                      {community.member_count} members
                    </span>
                    <button
                      onClick={() => joinCommunity(community._id)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && selectedCommunity && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
            💬 {selectedCommunity.name} Messages
          </h2>
          <MessageInterface
            messages={messages}
            onSendMessage={(content) => sendMessage(content, selectedCommunity._id)}
            onLoadMessages={() => loadMessages(selectedCommunity._id)}
          />
        </div>
      )}

      {/* Forums Tab */}
      {activeTab === 'forums' && selectedCommunity && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
            🗣️ {selectedCommunity.name} Forums
          </h2>
          <ForumInterface
            posts={forumPosts}
            onCreatePost={(title, content) => createForumPost(title, content, selectedCommunity._id)}
            onLoadPosts={() => loadForumPosts(selectedCommunity._id)}
          />
        </div>
      )}

      {/* Study Rooms Tab */}
      {activeTab === 'study-rooms' && selectedCommunity && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
            📚 {selectedCommunity.name} Study Rooms
          </h2>
          <StudyRoomInterface
            rooms={studyRooms}
            onCreateRoom={(name, description) => createStudyRoom(name, description, selectedCommunity._id)}
            onLoadRooms={() => loadStudyRooms(selectedCommunity._id)}
          />
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && selectedCommunity && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
            🏆 {selectedCommunity.name} Challenges
          </h2>
          <ChallengeInterface challenges={challenges} />
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
            🥇 Community Leaderboard
          </h2>
          <LeaderboardInterface leaderboard={leaderboard} />
        </div>
      )}

      {/* Community Selector for tabs that need it */}
      {(activeTab !== 'communities' && activeTab !== 'leaderboard') && (
        <div style={{ marginBottom: '20px' }}>
          <select
            value={selectedCommunity?._id || ''}
            onChange={(e) => {
              const community = myCommunities.find(c => c._id === e.target.value);
              setSelectedCommunity(community);
              if (activeTab === 'messages') loadMessages(community._id);
              if (activeTab === 'forums') loadForumPosts(community._id);
              if (activeTab === 'study-rooms') loadStudyRooms(community._id);
              if (activeTab === 'challenges') loadChallenges(community._id);
            }}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg2)',
              color: 'var(--text)'
            }}
          >
            <option value="">Select a community</option>
            {myCommunities.map(community => (
              <option key={community._id} value={community._id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// Message Interface Component
function MessageInterface({ messages, onSendMessage, onLoadMessages }) {
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    onLoadMessages();
  }, []);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      <div style={{
        flex: 1,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        overflowY: 'auto'
      }}>
        {messages.map(message => (
          <div key={message._id} style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--accent)' }}>
              {message.sender_name || 'Anonymous'}
            </div>
            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '8px', marginTop: '5px' }}>
              {message.content}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '5px' }}>
              {new Date(message.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--bg2)',
            color: 'var(--text)'
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '12px 20px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Forum Interface Component
function ForumInterface({ posts, onCreatePost, onLoadPosts }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    onLoadPosts();
  }, []);

  const handleCreatePost = () => {
    if (newPostTitle.trim() && newPostContent.trim()) {
      onCreatePost(newPostTitle.trim(), newPostContent.trim());
      setNewPostTitle('');
      setNewPostContent('');
      setShowCreateForm(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        style={{
          padding: '12px 20px',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        + New Discussion
      </button>

      {showCreateForm && (
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <input
            type="text"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Discussion title..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              marginBottom: '10px'
            }}
          />
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreatePost}
              style={{
                padding: '10px 20px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Post Discussion
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: 'var(--text3)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {posts.map(post => (
          <div key={post._id} style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
              {post.title}
            </h3>
            <p style={{ color: 'var(--text3)', marginBottom: '15px' }}>
              {post.content}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                {post.replies?.length || 0} replies
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Study Room Interface Component
function StudyRoomInterface({ rooms, onCreateRoom, onLoadRooms }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');

  useEffect(() => {
    onLoadRooms();
  }, []);

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim(), newRoomDescription.trim());
      setNewRoomName('');
      setNewRoomDescription('');
      setShowCreateForm(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        style={{
          padding: '12px 20px',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        + Create Study Room
      </button>

      {showCreateForm && (
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Study room name..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              marginBottom: '10px'
            }}
          />
          <textarea
            value={newRoomDescription}
            onChange={(e) => setNewRoomDescription(e.target.value)}
            placeholder="Describe the study goals..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg)',
              color: 'var(--text)',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateRoom}
              style={{
                padding: '10px 20px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Create Room
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: 'var(--text3)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {rooms.map(room => (
          <div key={room._id} style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
              {room.name}
            </h3>
            <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '15px' }}>
              {room.description || 'A place to study and collaborate'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                {room.current_participants?.length || 0} studying
              </span>
              <button
                style={{
                  padding: '6px 12px',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Challenge Interface Component
function ChallengeInterface({ challenges }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      {challenges.map(challenge => (
        <div key={challenge._id} style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
            {challenge.name}
          </h3>
          <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '15px' }}>
            {challenge.description}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
              {challenge.participants?.length || 0} joined
            </span>
            <button
              style={{
                padding: '6px 12px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Join Challenge
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Leaderboard Interface Component
function LeaderboardInterface({ leaderboard }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px' }}>🥇</span>
        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Top Contributors</h3>
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {leaderboard.map((member, index) => (
          <div key={member._id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px',
            background: 'var(--bg)',
            borderRadius: '8px',
            border: index < 3 ? '2px solid var(--accent)' : '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {index + 1}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                  {member.user_name || 'Anonymous'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  {member.community_name || 'Community Member'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent)' }}>
                {member.reputation || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                reputation points
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}