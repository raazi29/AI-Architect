import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  Target
} from 'lucide-react';
import IndiaLocalizationService from '@/lib/services/indiaLocalizationService';
import type {
  Project,
  ProjectTask,
  Material,
  Expense,
  ProjectMilestone
} from '@/lib/projectManagementService';

interface ProjectDashboardProps {
  project: Project;
  tasks: ProjectTask[];
  materials: Material[];
  expenses: Expense[];
  milestones: ProjectMilestone[];
}

export function ProjectDashboard({
  project,
  tasks,
  materials,
  expenses,
  milestones
}: ProjectDashboardProps) {
  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalMaterialsCost = materials.reduce((sum, mat) => sum + (mat.unit_cost * mat.quantity), 0);
  const totalTaskCosts = tasks.reduce((sum, task) => sum + task.cost, 0);

  const budgetUtilization = project.budget > 0 ?
    ((totalExpenses + totalMaterialsCost + totalTaskCosts) / project.budget) * 100 : 0;

  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = milestones.length;

  const upcomingMilestones = milestones
    .filter(m => new Date(m.target_date) > new Date() && m.status !== 'completed')
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Budget Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-blue-800">
              {IndiaLocalizationService.formatCurrency(project.budget)}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Utilized</span>
                <span>{budgetUtilization.toFixed(1)}%</span>
              </div>
              <Progress value={budgetUtilization} className="h-2" />
            </div>
            <div className="text-xs text-blue-600">
              Tasks: {IndiaLocalizationService.formatCurrency(totalTaskCosts)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Progress */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Task Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-green-800">
              {completedTasks}/{totalTasks}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span>{totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0}%</span>
              </div>
              <Progress value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} className="h-2" />
            </div>
            <div className="flex gap-2 text-xs">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                {inProgressTasks} In Progress
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Status */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-purple-800">
              {completedMilestones}/{totalMilestones}
            </div>
            <div className="space-y-2">
              {upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-purple-600" />
                    <span className="font-medium">{milestone.name}</span>
                  </div>
                  <div className="text-purple-600 ml-4">
                    {new Date(milestone.target_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {upcomingMilestones.length === 0 && totalMilestones > 0 && (
                <div className="text-xs text-purple-600">
                  All milestones completed!
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Health */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Project Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-orange-800">
              {project.project_type}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-orange-600" />
                <span>{project.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className={
                  project.state === 'tropical' ? 'bg-yellow-100 text-yellow-800' :
                  project.state === 'subtropical' ? 'bg-green-100 text-green-800' :
                  project.state === 'mountain' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {project.climate_zone} Zone
                </Badge>
              </div>
              {pendingTasks > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-700">
                  <AlertTriangle className="h-3 w-3" />
                  {pendingTasks} tasks pending
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
