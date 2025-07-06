import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, Square, Check, X, AlertTriangle, RefreshCw, Edit2, Save, XCircle, User } from 'lucide-react';

const API_BASE_URL = 'https://8aa6-103-47-133-159.ngrok-free.app/api';

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [newPic, setNewPic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTask, setEditTask] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editPic, setEditPic] = useState('');

  // Fetch todos from API
  const fetchTodos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setTodos(data.data);
      } else {
        setError('Failed to fetch todos');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new todo
  const addTodo = async () => {
    if (!newTask.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          task: newTask,
          priority: selectedPriority,
          pic: newPic
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTodos([data.data, ...todos]);
        setNewTask('');
        setNewPic('');
        setError('');
      } else {
        setError('Failed to add todo');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Add error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditTask(todo.task);
    setEditPriority(todo.priority);
    setEditPic(todo.pic || '');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditTask('');
    setEditPriority('medium');
    setEditPic('');
  };

  // Save edited todo
  const saveEdit = async (id) => {
    if (!editTask.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          task: editTask,
          priority: editPriority,
          pic: editPic
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTodos(todos.map(todo => 
          todo.id === id ? { ...todo, task: editTask, priority: editPriority, pic: editPic } : todo
        ));
        setEditingId(null);
        setEditTask('');
        setEditPriority('medium');
        setEditPic('');
        setError('');
      } else {
        setError('Failed to update todo');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Edit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update todo status
  const updateStatus = async (id, newStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTodos(todos.map(todo => 
          todo.id === id ? { ...todo, status: newStatus } : todo
        ));
        setError('');
      } else {
        setError('Failed to update todo');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete todo
  const deleteTodo = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTodos(todos.filter(todo => todo.id !== id));
        setError('');
      } else {
        setError('Failed to delete todo');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-600';
      case 'running': return 'bg-blue-600';
      case 'pending': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono p-4">
      {/* Header */}
      <div className="bg-black border border-green-400 p-3 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">CNC TASK CONTROL v2.2</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${error ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span className="text-sm">{error ? 'CONNECTION ERROR' : 'SYSTEM READY'}</span>
            </div>
            <div className="text-sm">
              TASKS: {todos.length} | ACTIVE: {todos.filter(t => t.status === 'running').length}
            </div>
            <button
              onClick={fetchTodos}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 border border-gray-400 flex items-center"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-400 p-3 mb-4 text-red-200">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Add Task Panel */}
      <div className="bg-black border border-green-400 p-3 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter new task..."
            className="flex-1 bg-gray-800 border border-gray-600 px-3 py-2 text-green-400 placeholder-gray-500 focus:outline-none focus:border-green-400"
            onKeyPress={(e) => e.key === 'Enter' && !loading && addTodo()}
            disabled={loading}
          />
          <input
            type="text"
            value={newPic}
            onChange={(e) => setNewPic(e.target.value)}
            placeholder="PIC (Person In Charge)"
            className="w-48 bg-gray-800 border border-gray-600 px-3 py-2 text-green-400 placeholder-gray-500 focus:outline-none focus:border-green-400"
            onKeyPress={(e) => e.key === 'Enter' && !loading && addTodo()}
            disabled={loading}
          />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-gray-800 border border-gray-600 px-3 py-2 text-green-400 focus:outline-none focus:border-green-400"
            disabled={loading}
          >
            <option value="low">LOW</option>
            <option value="medium">MED</option>
            <option value="high">HIGH</option>
          </select>
          <button
            onClick={addTodo}
            disabled={loading || !newTask.trim()}
            className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 border border-green-400 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            ADD
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-black border border-green-400">
        <div className="border-b border-green-400 p-2 bg-gray-800">
          <div className="grid grid-cols-12 gap-2 text-sm font-bold">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">TASK DESCRIPTION</div>
            <div className="col-span-2">PIC</div>
            <div className="col-span-1">STATUS</div>
            <div className="col-span-1">PRIORITY</div>
            <div className="col-span-2">CREATED</div>
            <div className="col-span-2">CONTROLS</div>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading && todos.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Loading tasks...
            </div>
          ) : todos.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No tasks found. Add a new task to get started.
            </div>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className={`border-b border-gray-700 p-2 hover:bg-gray-800 border-l-4 ${getPriorityColor(todo.priority)} ${loading ? 'opacity-50' : ''}`}>
                <div className="grid grid-cols-12 gap-2 items-center text-sm">
                  <div className="col-span-1 font-mono">
                    {String(todo.id).padStart(3, '0')}
                  </div>
                  
                  {/* Task Description with Edit Feature */}
                  <div className="col-span-3">
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editTask}
                        onChange={(e) => setEditTask(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 px-2 py-1 text-green-400 text-xs focus:outline-none focus:border-green-400"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveEdit(todo.id);
                          } else if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                        disabled={loading}
                        autoFocus
                      />
                    ) : (
                      <div className="truncate" title={todo.task}>
                        {todo.task}
                      </div>
                    )}
                  </div>
                  
                  {/* PIC Column */}
                  <div className="col-span-2">
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editPic}
                        onChange={(e) => setEditPic(e.target.value)}
                        placeholder="PIC"
                        className="w-full bg-gray-800 border border-gray-600 px-2 py-1 text-green-400 text-xs focus:outline-none focus:border-green-400"
                        disabled={loading}
                      />
                    ) : (
                      <div className="flex items-center truncate" title={todo.pic || 'No PIC assigned'}>
                        <User className="w-3 h-3 mr-1 text-gray-400" />
                        <span className={todo.pic ? 'text-green-400' : 'text-gray-500'}>
                          {todo.pic || 'Unassigned'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold text-black ${getStatusColor(todo.status)}`}>
                      {todo.status === 'running' && <Play className="w-3 h-3 mr-1" />}
                      {todo.status === 'completed' && <Check className="w-3 h-3 mr-1" />}
                      {todo.status === 'pending' && <Pause className="w-3 h-3 mr-1" />}
                      {todo.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    {editingId === todo.id ? (
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 px-1 py-1 text-green-400 text-xs focus:outline-none focus:border-green-400"
                        disabled={loading}
                      >
                        <option value="low">LOW</option>
                        <option value="medium">MED</option>
                        <option value="high">HIGH</option>
                      </select>
                    ) : (
                      <div className="flex items-center">
                        {todo.priority === 'high' && <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />}
                        <span className={`text-xs ${
                          todo.priority === 'high' ? 'text-red-400' : 
                          todo.priority === 'medium' ? 'text-yellow-400' : 
                          'text-green-400'
                        }`}>
                          {todo.priority.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-2 text-xs text-gray-400">
                    {formatDate(todo.created_at)}
                  </div>
                  
                  <div className="col-span-2 flex space-x-1">
                    {editingId === todo.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(todo.id)}
                          disabled={loading || !editTask.trim()}
                          className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-2 py-1 text-xs border border-green-400"
                          title="Save"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={loading}
                          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-2 py-1 text-xs border border-gray-400"
                          title="Cancel"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit Button */}
                        <button
                          onClick={() => startEditing(todo)}
                          disabled={loading}
                          className="bg-yellow-700 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-2 py-1 text-xs border border-yellow-400"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        
                        {/* Status Control Buttons */}
                        {todo.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(todo.id, 'running')}
                            disabled={loading}
                            className="bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-2 py-1 text-xs border border-blue-400"
                            title="Start"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        )}
                        {todo.status === 'running' && (
                          <>
                            <button
                              onClick={() => updateStatus(todo.id, 'completed')}
                              disabled={loading}
                              className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-2 py-1 text-xs border border-green-400"
                              title="Complete"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => updateStatus(todo.id, 'pending')}
                              disabled={loading}
                              className="bg-yellow-700 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-2 py-1 text-xs border border-yellow-400"
                              title="Pause"
                            >
                              <Pause className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {todo.status === 'completed' && (
                          <button
                            onClick={() => updateStatus(todo.id, 'pending')}
                            disabled={loading}
                            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-2 py-1 text-xs border border-gray-400"
                            title="Reset"
                          >
                            <Square className="w-3 h-3" />
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          disabled={loading}
                          className="bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-2 py-1 text-xs border border-red-400"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-black border border-green-400 p-2 mt-4">
        <div className="flex justify-between items-center text-xs">
          <div>
            PENDING: {todos.filter(t => t.status === 'pending').length} | 
            RUNNING: {todos.filter(t => t.status === 'running').length} | 
            COMPLETED: {todos.filter(t => t.status === 'completed').length}
          </div>
          <div>
            HIGH: {todos.filter(t => t.priority === 'high').length} | 
            MED: {todos.filter(t => t.priority === 'medium').length} | 
            LOW: {todos.filter(t => t.priority === 'low').length}
          </div>
          <div className="text-gray-400">
            API: {API_BASE_URL}
          </div>
        </div>
      </div>
    </div>
  );
}