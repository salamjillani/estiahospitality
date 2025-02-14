import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Loader2, Plus, Trash2, PencilLine, Save, X } from 'lucide-react';
import Navbar from "./Navbar";

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [newAgent, setNewAgent] = useState({ name: '', commission: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const data = await api.get('/api/booking-agents');
      setAgents(data);
    } catch (err) {
      setError('Failed to load agents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAgent.name || !newAgent.commission) return;
    try {
      const agent = await api.post('/api/booking-agents', {
        name: newAgent.name.trim(),
        commissionPercentage: parseFloat(newAgent.commission)
      });
      setAgents([...agents, agent]);
      setNewAgent({ name: '', commission: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id) => {
    const agent = agents.find(a => a._id === id);
    try {
      const updated = await api.put(`/api/booking-agents/${id}`, {
        name: agent.name,
        commissionPercentage: agent.commissionPercentage
      });
      setAgents(agents.map(a => a._id === id ? updated : a));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/booking-agents/${id}`);
      setAgents(agents.filter(a => a._id !== id));
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* Main content with top padding to account for fixed navbar */}
      <main className="flex-1 pt-16"> {/* pt-16 matches navbar height */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Booking Agents</h1>
            <Link 
              to="/dashboard" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 transition-all duration-200 hover:shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Agent Name"
                className="md:col-span-2 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              />
              <input
                type="number"
                placeholder="Commission %"
                className="md:col-span-2 w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={newAgent.commission}
                onChange={(e) => setNewAgent({ ...newAgent, commission: e.target.value })}
              />
              <button 
                onClick={handleCreate}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4" />
                <span>Add Agent</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center">
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Agent Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Commission</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr 
                      key={agent._id} 
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        {editingId === agent._id ? (
                          <input
                            value={agent.name}
                            onChange={(e) => setAgents(agents.map(a => 
                              a._id === agent._id ? {...a, name: e.target.value} : a
                            ))}
                            className="w-full px-3 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900">{agent.name}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {editingId === agent._id ? (
                          <input
                            type="number"
                            value={agent.commissionPercentage}
                            onChange={(e) => setAgents(agents.map(a => 
                              a._id === agent._id ? {...a, commissionPercentage: e.target.value} : a
                            ))}
                            className="w-32 px-3 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {agent.commissionPercentage}%
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {editingId === agent._id ? (
                            <>
                              <button
                                onClick={() => handleUpdate(agent._id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingId(agent._id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                                title="Edit"
                              >
                                <PencilLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(agent._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agents;