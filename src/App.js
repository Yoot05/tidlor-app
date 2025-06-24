import React, { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = null;
    
    if (typeof Storage !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  setToken(token) {
    this.token = token;
    if (typeof Storage !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  async login(email, password) {
    try {
      const normalizedEmail = email.toLowerCase();
      if (normalizedEmail === 'admin@tidlor.com' && password === 'P@ssw0rd') {
        const mockResponse = {
          accessToken: 'demo-access-token-12345',
          refreshToken: 'demo-refresh-token-67890',
          user: {
            id: '1',
            email: 'Admin@Tidlor.com',
            firstName: 'System',
            lastName: 'Administrator',
            role: 'Super Admin',
            organizationId: '1',
            organizationName: 'Tidlor Head Office',
            isTempPassword: false
          }
        };
        this.setToken(mockResponse.accessToken);
        return mockResponse;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      throw error;
    }
  }

  async validateToken() {
    return { valid: true, user: { userId: '1' } };
  }

  logout() {
    this.setToken(null);
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
}

const apiService = new ApiService();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if (typeof Storage === 'undefined') {
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        apiService.setToken(token);
        await apiService.validateToken();
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      
      if (typeof Storage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const changePassword = async () => {
    try {
      const updatedUser = { ...user, isTempPassword: false };
      setUser(updatedUser);
      if (typeof Storage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    if (!email.toLowerCase().endsWith('@tidlor.com')) {
      setError('Email must be from Tidlor.com domain');
      setLoading(false);
      return;
    }

    setTimeout(async () => {
      try {
        await login(email, password);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } catch (error) {
        setError(error.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Tidlor System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@tidlor.com"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const PortalPage = ({ onModuleSelect }) => {
  const { user, logout } = useAuth();

  const modules = [
    {
      id: 'module0',
      name: 'Gatekeeper',
      description: 'Authentication & Authorization Core',
      icon: '🔐',
      color: 'bg-blue-500',
      status: 'active'
    },
    {
      id: 'module1',
      name: 'User Management',
      description: 'Manage users, roles and organization hierarchy',
      icon: '👥',
      color: 'bg-green-500',
      status: 'active'
    },
    {
      id: 'module2',
      name: 'Data Collection',
      description: 'Field data collection system',
      icon: '📊',
      color: 'bg-purple-500',
      status: 'coming_soon'
    },
    {
      id: 'module3',
      name: 'Approval Workflow',
      description: 'Document approval management',
      icon: '✅',
      color: 'bg-orange-500',
      status: 'coming_soon'
    }
  ];

  const handleModuleClick = (module) => {
    if (module.status === 'coming_soon') {
      alert(module.name + ' module is coming soon!');
      return;
    }

    if (module.id === 'module0') {
      onModuleSelect('gatekeeper');
    } else if (module.id === 'module1') {
      onModuleSelect('user-management');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Tidlor System</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Portal
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user && user.firstName} {user && user.lastName}</span>
                <span className="block text-xs text-gray-500">{user && user.role}</span>
              </div>
              
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tidlor System Portal</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user && user.firstName}! Select a module to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-gray-300"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center text-white text-2xl mr-4`}>
                      {module.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        module.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {module.status === 'active' ? 'Active' : 'Coming Soon'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{module.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagementPage = ({ onBackToPortal }) => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('list');
  const [users, setUsers] = useState([
    {
      id: '1',
      email: 'Admin@Tidlor.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'Super Admin',
      organization: 'Tidlor Head Office',
      isActive: true,
      lastLogin: '2024-06-24'
    },
    {
      id: '2',
      email: 'john.doe@Tidlor.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Area Manager',
      organization: 'Bangkok Region',
      isActive: true,
      lastLogin: '2024-06-23'
    }
  ]);

  const handleCreateUser = () => {
    setCurrentPage('create');
  };

  const handleUserCreated = (newUser) => {
    const userWithId = {
      ...newUser,
      id: Date.now().toString(),
      isActive: true,
      lastLogin: null
    };
    setUsers([...users, userWithId]);
    setCurrentPage('list');
    alert('User created successfully!');
  };

  if (currentPage === 'create') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={onBackToPortal}
                  className="mr-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Back to Portal
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <CreateUserForm
            onBack={() => setCurrentPage('list')}
            onUserCreated={handleUserCreated}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={onBackToPortal}
                className="mr-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Portal
              </button>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Users</h2>
            <button
              onClick={handleCreateUser}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Create New User
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.firstName && user.lastName ? user.firstName[0] + user.lastName[0] : 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          {user.lastLogin ? 'Last login: ' + user.lastLogin : 'Never logged in'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        <div className="font-medium">{user.role}</div>
                        <div className="text-xs">{user.organization}</div>
                      </div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateUserForm = ({ onBack, onUserCreated }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    organization: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    'Super Admin',
    'Area Manager', 
    'Branch Manager',
    'Officer',
    'Clerk'
  ];

  const organizations = [
    'Tidlor Head Office',
    'Bangkok Region',
    'Upcountry Region',
    'Bangkok Central Branch',
    'Bangkok North Branch'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.firstName || !formData.lastName || !formData.role || !formData.organization) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (!formData.email.toLowerCase().endsWith('@tidlor.com')) {
      setError('Email must be from Tidlor.com domain');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      onUserCreated(formData);
      setLoading(false);
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to User List
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@tidlor.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <select
                  name="organization"
                  required
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const GatekeeperPage = ({ onBackToPortal }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={onBackToPortal}
                className="mr-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Portal
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Gatekeeper</h1>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white">
                  👥
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white">
                  🔑
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">45</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center text-white">
                  ⚠️
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Failed Logins</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center text-white">
                  🛡️
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Permissions</p>
                  <p className="text-2xl font-bold text-gray-900">18</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Current User Session
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">User</label>
                <p className="mt-1 text-sm text-gray-900">{user && user.firstName} {user && user.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Role</label>
                <p className="mt-1 text-sm text-gray-900">{user && user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Organization</label>
                <p className="mt-1 text-sm text-gray-900">{user && user.organizationName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent = ({ currentView, setCurrentView }) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('portal');
    } else {
      setCurrentView('login');
    }
  }, [isAuthenticated, setCurrentView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage onLoginSuccess={() => setCurrentView('portal')} />;
      case 'portal':
        return isAuthenticated ? <PortalPage onModuleSelect={(module) => setCurrentView(module)} /> : <LoginPage onLoginSuccess={() => setCurrentView('portal')} />;
      case 'gatekeeper':
        return isAuthenticated ? <GatekeeperPage onBackToPortal={() => setCurrentView('portal')} /> : <LoginPage onLoginSuccess={() => setCurrentView('portal')} />;
      case 'user-management':
        return isAuthenticated ? <UserManagementPage onBackToPortal={() => setCurrentView('portal')} /> : <LoginPage onLoginSuccess={() => setCurrentView('portal')} />;
      default:
        return <LoginPage onLoginSuccess={() => setCurrentView('portal')} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentView()}
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('login');

  return (
    <AuthProvider>
      <AppContent currentView={currentView} setCurrentView={setCurrentView} />
    </AuthProvider>
  );
};

export default App;