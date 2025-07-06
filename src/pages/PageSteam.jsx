import React, { useState, useEffect } from 'react';
import { User, MapPin, Calendar, Hash, Edit, Trash2, UserPlus, Search } from 'lucide-react';

const API_BASE_URL = 'https://8aa6-103-47-133-159.ngrok-free.app/api';

const MemberProfile = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/members`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint not found. Please check the API URL.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMembers(data.data);
        if (!selectedMember && data.data.length > 0) {
          setSelectedMember(data.data[0]);
        }
      } else {
        showMessage('error', data.message || 'Failed to fetch members');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      showMessage('error', error.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        address: member.address
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        address: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setFormData({
      name: '',
      address: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      showMessage('error', 'Name and address are required');
      return;
    }

    setLoading(true);
    try {
      const url = editingMember 
        ? `${API_BASE_URL}/members/${editingMember.id}`
        : `${API_BASE_URL}/members`;
      
      const method = editingMember ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', data.message || 'Operation successful');
        fetchMembers();
        closeModal();
      } else {
        showMessage('error', data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Failed to save member: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/members/${id}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', data.message || 'Member deleted successfully');
        if (selectedMember && selectedMember.id === id) {
          const remainingMembers = members.filter(m => m.id !== id);
          setSelectedMember(remainingMembers.length > 0 ? remainingMembers[0] : null);
        }
        fetchMembers();
      } else {
        showMessage('error', data.message || 'Failed to delete member');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Failed to delete member: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (id) => {
    const colors = [
      'bg-blue-900 text-blue-200 border-blue-500',
      'bg-green-900 text-green-200 border-green-500',
      'bg-purple-900 text-purple-200 border-purple-500',
      'bg-pink-900 text-pink-200 border-pink-500',
      'bg-indigo-900 text-indigo-200 border-indigo-500',
      'bg-yellow-900 text-yellow-200 border-yellow-500',
      'bg-red-900 text-red-200 border-red-500',
      'bg-teal-900 text-teal-200 border-teal-500'
    ];
    return colors[id % colors.length];
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="min-h-screen bg-black p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 rounded-none shadow-sm p-4 mb-4 border border-green-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-white">Member Profiles</h1>
              <p className="text-gray-400 mt-1 text-sm">Manage and view steam member information</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-gray-800 border border-green-500 text-white rounded-none focus:outline-none focus:ring-0 w-full text-sm"
                />
              </div>
              <button 
                onClick={() => openModal()}
                disabled={loading}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-none border border-green-500 transition-colors disabled:opacity-50 whitespace-nowrap text-sm"
              >
                <UserPlus size={16} />
                Add Member
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-none ${
            message.type === 'error' ? 'bg-red-900 text-red-200 border border-red-500' : 
            'bg-green-900 text-green-200 border border-green-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-4 flex items-center gap-2 border border-green-500">
              <div className="animate-spin rounded-none h-5 w-5 border-b-2 border-green-500"></div>
              <span className="text-white text-sm">Loading...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Members List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-none shadow-sm p-4 border border-green-500">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-white">Members</h2>
                <span className="bg-gray-800 text-gray-300 rounded-none px-2 py-1 text-xs border border-green-500">
                  {filteredMembers.length} members
                </span>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-5 text-gray-400 text-sm">
                    {loading ? 'Loading members...' : 'No members found'}
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`p-3 rounded-none cursor-pointer transition-all border ${
                        selectedMember?.id === member.id
                          ? 'bg-gray-800 border-green-500'
                          : 'bg-gray-900 border-green-500 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-none ${getRandomColor(member.id)} flex items-center justify-center text-sm font-bold border border-green-500`}>
                          {getInitials(member.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate text-sm">{member.name}</h3>
                          <p className="text-xs text-gray-400 truncate">{member.address}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            {selectedMember ? (
              <div className="bg-gray-900 rounded-none shadow-sm overflow-hidden border border-green-500">
                {/* Profile Header */}
                <div className="bg-gray-900 p-4 border-b border-green-500">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className={`w-16 h-16 rounded-none ${getRandomColor(selectedMember.id)} flex items-center justify-center text-white text-xl font-bold border border-green-500`}>
                      {getInitials(selectedMember.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-bold text-white mb-1">{selectedMember.name}</h2>
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-none text-xs bg-gray-800 text-gray-300 border border-green-500">
                              Active Member
                            </span>
                            <span className="text-gray-400 text-xs">
                              ID: {selectedMember.id}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openModal(selectedMember)}
                            disabled={loading}
                            className="p-1 bg-gray-800 hover:bg-gray-700 rounded-none border border-green-500 transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit className="text-white" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(selectedMember.id, selectedMember.name)}
                            disabled={loading}
                            className="p-1 bg-gray-800 hover:bg-gray-700 rounded-none border border-green-500 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="text-white" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Basic Information */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-white pb-1 border-b border-green-500">Basic Information</h3>
                      
                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-gray-800 rounded-none border border-green-500">
                          <User className="text-gray-400" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Full Name</p>
                          <p className="font-medium text-white text-sm">{selectedMember.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-gray-800 rounded-none border border-green-500">
                          <MapPin className="text-gray-400" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Address</p>
                          <p className="font-medium text-white text-sm">{selectedMember.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Technical Information */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-white pb-1 border-b border-green-500">Technical Information</h3>
                      
                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-gray-800 rounded-none border border-green-500">
                          <Hash className="text-gray-400" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">UUID</p>
                          <p className="font-medium text-white text-sm break-all">
                            {selectedMember.uuid || 'Not assigned'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-gray-800 rounded-none border border-green-500">
                          <Calendar className="text-gray-400" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Created</p>
                          <p className="font-medium text-white text-sm">
                            {selectedMember.created_at ? new Date(selectedMember.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-none shadow-sm p-8 text-center border border-green-500">
                <div className="w-20 h-20 mx-auto mb-3 bg-gray-800 rounded-none flex items-center justify-center border border-green-500">
                  <User className="text-gray-500" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No Member Selected</h3>
                <p className="text-gray-500 mb-4 text-sm">Select a member from the list to view their profile</p>
                <button 
                  onClick={() => openModal()}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-none border border-green-500 transition-colors mx-auto text-sm"
                >
                  <UserPlus size={16} />
                  Add New Member
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-3">
            <div className="bg-gray-900 rounded-none max-w-md w-full max-h-[90vh] overflow-y-auto border border-green-500">
              <div className="p-4 border-b border-green-500">
                <h2 className="text-lg font-semibold text-white">
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter member name"
                      required
                      className="w-full px-2 py-1 bg-gray-800 border border-green-500 text-white rounded-none focus:outline-none text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter member address"
                      rows="3"
                      required
                      className="w-full px-2 py-1 bg-gray-800 border border-green-500 text-white rounded-none focus:outline-none text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    className="flex-1 px-3 py-1 bg-gray-800 border border-green-500 text-gray-300 rounded-none hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded-none hover:bg-green-700 transition-colors disabled:opacity-50 text-sm border border-green-500"
                  >
                    {loading ? 'Saving...' : (editingMember ? 'Update' : 'Create')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberProfile;