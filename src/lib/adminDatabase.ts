import { db, auth } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  user_metadata: {
    full_name?: string;
    phone?: string;
    location?: string;
  };
  report_count: number;
}

export interface AdminReport {
  id: string;
  corrupt_person_name: string;
  designation: string;
  address?: string;
  area_region: string;
  latitude?: number;
  longitude?: number;
  description: string;
  category: string;
  approached_authorities: boolean;
  was_resolved: boolean;
  evidence_files?: string[];
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  status: string;
  dispute_count: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalReports: number;
  anonymousReports: number;
  verifiedReports: number;
  pendingReports: number;
  resolvedReports: number;
  disputedReports: number;
  reportsThisMonth: number;
  usersThisMonth: number;
}

export class AdminDatabaseService {
  // Check if current user is admin
  private static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      const isAdmin = user?.email?.endsWith('@corruptionwatchdog.in') || false;
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get all users with their report counts
  static async getAllUsers(filters?: {
    search?: string;
    hasReports?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AdminUser[] | null; error: any; count?: number }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: new Error('Admin access required') };
      }

      // Fetch all reports to extract unique users (legacy behavior)
      const reportsRef = collection(db, 'corruption_reports');
      const querySnapshot = await getDocs(reportsRef);
      const allReports = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: (doc.data().created_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString()
      }));

      const userMap = new Map<string, AdminUser>();

      // Add admin user if logged in
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        userMap.set(currentUser.email, {
          id: currentUser.uid,
          email: currentUser.email,
          created_at: currentUser.metadata.creationTime || new Date().toISOString(),
          email_confirmed_at: currentUser.emailVerified ? new Date().toISOString() : null,
          last_sign_in_at: currentUser.metadata.lastSignInTime || new Date().toISOString(),
          user_metadata: {
            full_name: currentUser.displayName || 'Admin User',
            phone: currentUser.phoneNumber || '',
            location: ''
          },
          report_count: 0
        });
      }

      const reportCountMap = new Map<string, number>();

      allReports.forEach((report: any) => {
        if (report.reporter_email && !report.is_anonymous) {
          const count = reportCountMap.get(report.reporter_email) || 0;
          reportCountMap.set(report.reporter_email, count + 1);

          if (!userMap.has(report.reporter_email)) {
            userMap.set(report.reporter_email, {
              id: `user-${report.reporter_email}`,
              email: report.reporter_email,
              created_at: report.created_at,
              email_confirmed_at: report.created_at,
              last_sign_in_at: report.created_at,
              user_metadata: {
                full_name: report.reporter_name || 'Unknown User',
                phone: '',
                location: ''
              },
              report_count: 0
            });
          }
        }
      });

      userMap.forEach((user, email) => {
        user.report_count = reportCountMap.get(email) || 0;
      });

      let users = Array.from(userMap.values());

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        users = users.filter(user =>
          user.email.toLowerCase().includes(searchLower) ||
          user.user_metadata.full_name?.toLowerCase().includes(searchLower) ||
          user.id.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.hasReports !== undefined) {
        users = users.filter(user =>
          filters.hasReports ? user.report_count > 0 : user.report_count === 0
        );
      }

      users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const startIndex = filters?.offset || 0;
      const endIndex = startIndex + (filters?.limit || 50);
      const paginatedUsers = users.slice(startIndex, endIndex);

      return { data: paginatedUsers, error: null, count: users.length };

    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: null, error };
    }
  }

  // Get all reports with user information
  static async getAllReports(filters?: {
    search?: string;
    category?: string;
    status?: string;
    isAnonymous?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AdminReport[] | null; error: any; count?: number }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: new Error('Admin access required') };
      }

      const reportsRef = collection(db, 'corruption_reports');
      let q = query(reportsRef, orderBy('created_at', 'desc'));

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.isAnonymous !== undefined) {
        q = query(q, where('is_anonymous', '==', filters.isAnonymous));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);

      let reports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: (data.created_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString(),
          updated_at: (data.updated_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString()
        }
      }) as AdminReport[];

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        reports = reports.filter(r =>
          r.corrupt_person_name.toLowerCase().includes(searchLower) ||
          r.designation.toLowerCase().includes(searchLower) ||
          r.area_region.toLowerCase().includes(searchLower) ||
          (r.reporter_email || '').toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower)
        );
      }

      // Fetching total count is not efficient in Firestore (requires reading all docs or aggregation query).
      // For now, we return length of fetched docs as count if no limit, or just an estimation if needed.
      // But preserving existing interface:
      return { data: reports, error: null, count: reports.length };

    } catch (error) {
      console.error('Error fetching reports:', error);
      return { data: null, error };
    }
  }

  // Get admin dashboard statistics
  static async getAdminStats(): Promise<{ data: AdminStats | null; error: any }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: new Error('Admin access required') };
      }

      const reportsRef = collection(db, 'corruption_reports');
      const querySnapshot = await getDocs(reportsRef);
      const allReports = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: (doc.data().created_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString()
      }));

      const totalReports = allReports.length;
      const anonymousReports = allReports.filter((r: any) => r.is_anonymous).length;
      const verifiedReports = allReports.filter((r: any) => r.status === 'verified').length;
      const pendingReports = allReports.filter((r: any) => r.status === 'pending').length;
      const resolvedReports = allReports.filter((r: any) => r.status === 'resolved').length;
      const disputedReports = allReports.filter((r: any) => r.status === 'disputed').length;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const reportsThisMonth = allReports.filter((r: any) =>
        new Date(r.created_at) >= thisMonth
      ).length;

      const uniqueUserEmails = new Set(
        allReports.filter((r: any) => !r.is_anonymous && r.reporter_email)
          .map((r: any) => r.reporter_email)
      );
      const totalUsers = uniqueUserEmails.size + 1; // +1 for admin

      const usersThisMonth = allReports.filter((r: any) =>
        !r.is_anonymous && r.reporter_email && new Date(r.created_at) >= thisMonth
      ).length;

      const stats: AdminStats = {
        totalUsers,
        totalReports,
        anonymousReports,
        verifiedReports,
        pendingReports,
        resolvedReports,
        disputedReports,
        reportsThisMonth,
        usersThisMonth
      };

      return { data: stats, error: null };

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return { data: null, error };
    }
  }

  // Update report status
  static async updateReportStatus(reportId: string, status: string): Promise<{ error: any }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      const reportRef = doc(db, 'corruption_reports', reportId);
      await updateDoc(reportRef, {
        status,
        updated_at: new Date().toISOString()
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating report status:', error);
      return { error };
    }
  }

  // Delete report
  static async deleteReport(reportId: string): Promise<{ error: any }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      const reportRef = doc(db, 'corruption_reports', reportId);
      await deleteDoc(reportRef);

      return { error: null };

    } catch (error) {
      console.error('Error in deleteReport function:', error);
      return { error };
    }
  }

  // Bulk delete reports
  static async bulkDeleteReports(reportIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
    error?: any;
  }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return {
          success: 0,
          failed: reportIds.length,
          errors: ['Admin access required'],
          error: new Error('Admin access required')
        };
      }

      const batch = writeBatch(db);
      reportIds.forEach(id => {
        const ref = doc(db, 'corruption_reports', id);
        batch.delete(ref);
      });

      await batch.commit();

      return {
        success: reportIds.length,
        failed: 0,
        errors: []
      };

    } catch (error) {
      console.error('Error in bulkDeleteReports function:', error);
      return {
        success: 0,
        failed: reportIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        error
      };
    }
  }

  // Bulk update report status
  static async bulkUpdateReportStatus(reportIds: string[], status: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
    error?: any;
  }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return {
          success: 0,
          failed: reportIds.length,
          errors: ['Admin access required'],
          error: new Error('Admin access required')
        };
      }

      const validStatuses = ['pending', 'verified', 'disputed', 'resolved'];
      if (!validStatuses.includes(status)) {
        return {
          success: 0,
          failed: reportIds.length,
          errors: [`Invalid status: ${status}`],
          error: new Error(`Invalid status: ${status}`)
        };
      }

      const batch = writeBatch(db);
      reportIds.forEach(id => {
        const ref = doc(db, 'corruption_reports', id);
        batch.update(ref, {
          status,
          updated_at: new Date().toISOString()
        });
      });

      await batch.commit();

      return {
        success: reportIds.length,
        failed: 0,
        errors: []
      };

    } catch (error) {
      console.error('Error in bulkUpdateReportStatus function:', error);
      return {
        success: 0,
        failed: reportIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        error
      };
    }
  }

  // Get reports by user email
  static async getReportsByUser(userEmail: string): Promise<{ data: AdminReport[] | null; error: any }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: new Error('Admin access required') };
      }

      const reportsRef = collection(db, 'corruption_reports');
      const q = query(reportsRef, where('reporter_email', '==', userEmail), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);

      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: (doc.data().created_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString()
      })) as AdminReport[];

      return { data: reports, error: null };

    } catch (error) {
      console.error('Error in getReportsByUser:', error);
      return { data: null, error };
    }
  }

  // Reset user password
  static async resetUserPassword(userEmail: string): Promise<{ error: any }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      await sendPasswordResetEmail(auth, userEmail);
      return { error: null };

    } catch (error) {
      console.error('Error in resetUserPassword:', error);
      return { error };
    }
  }

  static async deleteUser(_userId: string): Promise<{ error: any }> {
    return { error: new Error('User deletion requires server-side implementation with Firebase Admin SDK') };
  }

  static async toggleUserBan(_userId: string, _banned: boolean): Promise<{ error: any }> {
    return { error: new Error('User ban/unban requires server-side implementation with Firebase Admin SDK') };
  }

  static async updateUserMetadata(_userId: string, _metadata: any): Promise<{ error: any }> {
    return { error: new Error('User metadata update requires server-side implementation with Firebase Admin SDK') };
  }
}