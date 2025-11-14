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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Budget Overview */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Budget Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold text-foreground">
              {IndiaLocalizationService.formatCurrency(project.budget)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Utilized</span>
                <span className="font-semibold text-foreground">{budgetUtilization.toFixed(1)}%</span>
              </div>
              <Progress value={budgetUtilization} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              Tasks: <span className="font-medium text-foreground">{IndiaLocalizationService.formatCurrency(totalTaskCosts)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Progress */}
      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span>Task Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold text-foreground">
              {completedTasks}/{totalTasks}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Completed</span>
                <span className="font-semibold text-foreground">{totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0}%</span>
              </div>
              <Progress value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} className="h-2" />
            </div>
            <div className="flex gap-2 text-xs">
              <Badge variant="secondary" className="font-normal">
                <Clock className="h-3 w-3 mr-1" />
                {inProgressTasks} In Progress
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Status */}
      <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span>Milestones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold text-foreground">
              {completedMilestones}/{totalMilestones}
            </div>
            <div className="space-y-2">
              {upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="text-xs border-l-2 border-purple-200 dark:border-purple-800 pl-2 py-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-foreground">{milestone.name}</span>
                  </div>
                  <div className="text-muted-foreground ml-4">
                    {new Date(milestone.target_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {upcomingMilestones.length === 0 && totalMilestones > 0 && (
                <div className="text-sm text-muted-foreground">
                  All milestones completed!
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Health */}
      <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span>Project Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-foreground">
              {project.project_type}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-foreground">{project.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-normal">
                  {project.climate_zone} Zone
                </Badge>
              </div>
              {pendingTasks > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded">
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
