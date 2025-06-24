/**
 * Authentication Redux Slice
 * AI-Powered eLearning Platform - Frontend
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginForm, RegisterForm } from '../../types';
import { authService } from '../../services/authService';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  error: string | null;
  loginAttempts: number;
  isAccountLocked: boolean;
  lockoutEndTime: Date | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  requiresTwoFactor: false,
  error: null,
  loginAttempts: 0,
  isAccountLocked: false,
  lockoutEndTime: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      
      if (response.requiresTwoFactor) {
        return { requiresTwoFactor: true };
      }

      // Store tokens
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);

      return {
        user: response.user,
        tokens: response.tokens,
        requiresTwoFactor: false,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      // Handle account lockout
      if (error.response?.status === 423) {
        return rejectWithValue({
          message: errorMessage,
          isAccountLocked: true,
          lockoutDuration: error.response.data.lockoutDuration,
        });
      }

      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterForm, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (state.auth.accessToken) {
        await authService.logout();
      }
    } catch (error) {
      // Even if logout API fails, we should still clear local storage
      console.warn('Logout API failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      
      // Update stored tokens
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);

      return response.tokens;
    } catch (error: any) {
      // Clear tokens if refresh fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      const errorMessage = error.response?.data?.message || error.message || 'Token refresh failed';
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response.profile;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get user data';
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Email verification failed';
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Password reset request failed';
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(token, newPassword);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Password reset failed';
      return rejectWithValue({ message: errorMessage });
    }
  }
);

// Slice
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRequiresTwoFactor: (state, action: PayloadAction<boolean>) => {
      state.requiresTwoFactor = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    clearAuthState: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.requiresTwoFactor = false;
      state.error = null;
      state.loginAttempts = 0;
      state.isAccountLocked = false;
      state.lockoutEndTime = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
    },
    setAccountLocked: (state, action: PayloadAction<{ duration: number }>) => {
      state.isAccountLocked = true;
      state.lockoutEndTime = new Date(Date.now() + action.payload.duration);
    },
    clearAccountLock: (state) => {
      state.isAccountLocked = false;
      state.lockoutEndTime = null;
      state.loginAttempts = 0;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.loginAttempts = 0;
        state.isAccountLocked = false;
        state.lockoutEndTime = null;

        if (action.payload.requiresTwoFactor) {
          state.requiresTwoFactor = true;
        } else {
          state.user = action.payload.user!;
          state.accessToken = action.payload.tokens!.accessToken;
          state.refreshToken = action.payload.tokens!.refreshToken;
          state.isAuthenticated = true;
          state.requiresTwoFactor = false;
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Login failed';
        state.isAuthenticated = false;
        state.requiresTwoFactor = false;
        
        if ((action.payload as any)?.isAccountLocked) {
          state.isAccountLocked = true;
          state.lockoutEndTime = new Date(Date.now() + (action.payload as any).lockoutDuration);
        } else {
          state.loginAttempts += 1;
        }
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Registration failed';
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.requiresTwoFactor = false;
        state.error = null;
        state.loginAttempts = 0;
        state.isAccountLocked = false;
        state.lockoutEndTime = null;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = (action.payload as any)?.message || 'Token refresh failed';
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to get user data';
        // Don't clear authentication state here, might just be a network error
      });

    // Verify Email
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        if (state.user) {
          state.user.emailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Email verification failed';
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Password reset request failed';
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Password reset failed';
      });
  },
});

export const {
  clearError,
  setRequiresTwoFactor,
  updateUser,
  clearAuthState,
  incrementLoginAttempts,
  resetLoginAttempts,
  setAccountLocked,
  clearAccountLock,
} = authSlice.actions;

export default authSlice.reducer;