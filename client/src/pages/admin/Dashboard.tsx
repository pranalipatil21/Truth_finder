import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { adminApi, AdminStats } from '@/api/admin.api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, HelpCircle, FolderTree, BarChart3, Loader2 } from 'lucide-react';

export function AdminDashboard() {

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage users, question banks, and monitor platform analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage all platform users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/users">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <HelpCircle className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Questions</CardTitle>
            <CardDescription>
              Manage question bank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/questions">
              <Button variant="outline" className="w-full">Question Bank</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <FolderTree className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Manage skill categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/skills">
              <Button variant="outline" className="w-full">Manage Skills</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-yellow-600 mb-2" />
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              Platform statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/analytics">
              <Button variant="outline" className="w-full">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              ) : (
                <p className="text-4xl font-bold text-blue-600">{stats?.userCount || 0}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
              ) : (
                <p className="text-4xl font-bold text-green-600">{stats?.assessmentCount || 0}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Assessments Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
              ) : (
                <p className="text-4xl font-bold text-purple-600">{stats?.questionCount || 0}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Questions in Bank</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
