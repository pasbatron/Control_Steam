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
        // Auto-select first member if none selected
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
        // If deleted member was selected, select another one
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
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-teal-100 text-teal-800 border-teal-200'
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
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Member Profiles</h1>
              <p className="text-gray-600 mt-1">Manage and view steam member information</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
              <button 
                onClick={() => openModal()}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <UserPlus size={20} />
                Add Member
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : 
            'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg flex items-center gap-3 shadow-xl">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Loading...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Members</h2>
                <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm">
                  {filteredMembers.length} members
                </span>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? 'Loading members...' : 'No members found'}
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`p-4 rounded-lg cursor-pointer transition-all border ${
                        selectedMember?.id === member.id
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${getRandomColor(member.id)} flex items-center justify-center text-base font-bold border`}>
                          {getInitials(member.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{member.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{member.address}</p>
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
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                {/* Profile Header */}
                <div className="bg-white p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className={`w-20 h-20 rounded-full ${getRandomColor(selectedMember.id)} flex items-center justify-center text-white text-2xl font-bold border`}>
                      {getInitials(selectedMember.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedMember.name}</h2>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Active Member
                            </span>
                            <span className="text-gray-600 text-sm">
                              ID: {selectedMember.id}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(selectedMember)}
                            disabled={loading}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit className="text-gray-700" size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(selectedMember.id, selectedMember.name)}
                            disabled={loading}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="text-gray-700" size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">Basic Information</h3>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <User className="text-gray-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Full Name</p>
                          <p className="font-medium text-gray-900">{selectedMember.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <MapPin className="text-gray-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Address</p>
                          <p className="font-medium text-gray-900">{selectedMember.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Technical Information */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">Technical Information</h3>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Hash className="text-gray-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">UUID</p>
                          <p className="font-medium text-gray-900 break-all">
                            {selectedMember.uuid || 'Not assigned'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Calendar className="text-gray-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Created</p>
                          <p className="font-medium text-gray-900">
                            {selectedMember.created_at ? new Date(selectedMember.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                  <User className="text-gray-400" size={40} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Member Selected</h3>
                <p className="text-gray-600 mb-6">Select a member from the list to view their profile</p>
                <button 
                  onClick={() => openModal()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                >
                  <UserPlus size={20} />
                  Add New Member
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-300">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </h2>
              </div>
              
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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