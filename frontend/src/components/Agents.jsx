// src/components/Agents.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Loader2, Plus, Trash2, PencilLine, Save, X } from 'lucide-react';

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

  if (loading) return <div className="text-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Booking Agents Management</h1>
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder="Agent Name"
            className="col-span-2 p-2 border rounded"
            value={newAgent.name}
            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Commission %"
            className="col-span-2 p-2 border rounded"
            value={newAgent.commission}
            onChange={(e) => setNewAgent({ ...newAgent, commission: e.target.value })}
          />
          <button 
            onClick={handleCreate}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Agent
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 p-3 rounded mb-4 text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Agent Name</th>
              <th className="p-3 text-left">Commission</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent._id} className="border-t">
                <td className="p-3">
                  {editingId === agent._id ? (
                    <input
                      value={agent.name}
                      onChange={(e) => setAgents(agents.map(a => 
                        a._id === agent._id ? {...a, name: e.target.value} : a
                      ))}
                      className="w-full p-1 border"
                    />
                  ) : (
                    agent.name
                  )}
                </td>
                <td className="p-3">
                  {editingId === agent._id ? (
                    <input
                      type="number"
                      value={agent.commissionPercentage}
                      onChange={(e) => setAgents(agents.map(a => 
                        a._id === agent._id ? {...a, commissionPercentage: e.target.value} : a
                      ))}
                      className="w-full p-1 border"
                    />
                  ) : (
                    `${agent.commissionPercentage}%`
                  )}
                </td>
                <td className="p-3 flex gap-2">
                  {editingId === agent._id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(agent._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingId(agent._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <PencilLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Agents;