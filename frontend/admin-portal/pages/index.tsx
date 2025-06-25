import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🏛️ Diplomatic Language Platform
            </h1>
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">
              Administrator Portal
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Manage diplomatic language training programs, monitor user progress, 
              and oversee AI-powered cultural education services for the American diplomatic community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">👥 User Management</h3>
              <p className="text-blue-100 mb-4">Manage diplomatic personnel accounts and access levels</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition">
                Manage Users
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">📚 Content Library</h3>
              <p className="text-green-100 mb-4">Oversee language courses and cultural training materials</p>
              <button className="bg-white text-green-600 px-4 py-2 rounded font-medium hover:bg-green-50 transition">
                Manage Content
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">🤖 AI Services</h3>
              <p className="text-purple-100 mb-4">Monitor speech recognition, NLP, and translation services</p>
              <button className="bg-white text-purple-600 px-4 py-2 rounded font-medium hover:bg-purple-50 transition">
                AI Dashboard
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">📊 Analytics</h3>
              <p className="text-yellow-100 mb-4">View platform usage statistics and learning outcomes</p>
              <button className="bg-white text-orange-600 px-4 py-2 rounded font-medium hover:bg-orange-50 transition">
                View Reports
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">🛡️ Security</h3>
              <p className="text-red-100 mb-4">Monitor system security and compliance status</p>
              <button className="bg-white text-red-600 px-4 py-2 rounded font-medium hover:bg-red-50 transition">
                Security Center
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">⚙️ System Config</h3>
              <p className="text-indigo-100 mb-4">Configure platform settings and integrations</p>
              <button className="bg-white text-indigo-600 px-4 py-2 rounded font-medium hover:bg-indigo-50 transition">
                Settings
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Platform Status: <span className="text-green-600 font-semibold">●</span> Online | 
              Active Users: <span className="font-semibold">247</span> | 
              Services: <span className="font-semibold">All Systems Operational</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}