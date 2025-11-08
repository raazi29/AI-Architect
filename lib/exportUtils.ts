import IndiaLocalizationService from './services/indiaLocalizationService';
import { Project, ProjectTask, Material, Expense, ProjectMilestone } from './projectManagementService';

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const exportProjectSummary = (
  project: Project,
  tasks: ProjectTask[],
  materials: Material[],
  expenses: Expense[],
  milestones: ProjectMilestone[]
) => {
  const totalTaskCost = tasks.reduce((sum, task) => sum + (task.cost || 0), 0);
  const totalMaterialCost = materials.reduce((sum, material) => sum + material.total_cost, 0);
  const totalExpenseCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalProjectCost = totalTaskCost + totalMaterialCost + totalExpenseCost;

  const summary = {
    'Project Name': project.name,
    'Description': project.description,
    'Budget': IndiaLocalizationService.formatCurrency(project.budget),
    'Total Cost': IndiaLocalizationService.formatCurrency(totalProjectCost),
    'Remaining': IndiaLocalizationService.formatCurrency(project.budget - totalProjectCost),
    'Location': project.location,
    'Climate Zone': project.climate_zone,
    'Project Type': project.project_type,
    'Total Tasks': tasks.length,
    'Completed Tasks': tasks.filter(t => t.status === 'completed').length,
    'Total Materials': materials.length,
    'Total Expenses': expenses.length,
    'Total Milestones': milestones.length,
    'Completed Milestones': milestones.filter(m => m.status === 'completed').length,
  };

  return summary;
};

export const exportTasksToCSV = (tasks: ProjectTask[], projectName: string) => {
  const data = tasks.map(task => ({
    'Task Name': task.name,
    'Category': task.category,
    'Assigned To': task.assigned_to || '-',
    'Cost (₹)': task.cost || 0,
    'Duration (days)': task.duration || 0,
    'Status': task.status,
    'Start Date': task.start_date || '-',
    'End Date': task.end_date || '-',
  }));

  exportToCSV(data, `${projectName}_tasks`);
};

export const exportMaterialsToCSV = (materials: Material[], projectName: string) => {
  const data = materials.map(material => ({
    'Material Name': material.name,
    'Category': material.category,
    'Unit': material.unit,
    'Unit Cost (₹)': material.unit_cost,
    'Quantity': material.quantity,
    'Total Cost (₹)': material.total_cost,
  }));

  exportToCSV(data, `${projectName}_materials`);
};

export const exportExpensesToCSV = (expenses: Expense[], projectName: string) => {
  const data = expenses.map(expense => ({
    'Description': expense.description,
    'Category': expense.category,
    'Amount (₹)': expense.amount,
    'GST Applicable': expense.gst_applicable ? 'Yes' : 'No',
    'GST Rate (%)': expense.gst_rate || 0,
    'GST Amount (₹)': expense.gst_amount || 0,
    'Date': expense.expense_date,
  }));

  exportToCSV(data, `${projectName}_expenses`);
};

export const exportMilestonesToCSV = (milestones: ProjectMilestone[], projectName: string) => {
  const data = milestones.map(milestone => ({
    'Milestone Name': milestone.name,
    'Description': milestone.description || '-',
    'Target Date': milestone.target_date,
    'Status': milestone.status,
  }));

  exportToCSV(data, `${projectName}_milestones`);
};

export const exportFullProjectReport = (
  project: Project,
  tasks: ProjectTask[],
  materials: Material[],
  expenses: Expense[],
  milestones: ProjectMilestone[]
) => {
  const summary = exportProjectSummary(project, tasks, materials, expenses, milestones);
  
  const report = [
    '=== PROJECT SUMMARY ===',
    ...Object.entries(summary).map(([key, value]) => `${key}: ${value}`),
    '',
    '=== TASKS ===',
    ...tasks.map(t => `${t.name} - ${t.status} - ${IndiaLocalizationService.formatCurrency(t.cost || 0)}`),
    '',
    '=== MATERIALS ===',
    ...materials.map(m => `${m.name} - ${m.quantity} ${m.unit} - ${IndiaLocalizationService.formatCurrency(m.total_cost)}`),
    '',
    '=== EXPENSES ===',
    ...expenses.map(e => `${e.description} - ${e.category} - ${IndiaLocalizationService.formatCurrency(e.amount)}`),
    '',
    '=== MILESTONES ===',
    ...milestones.map(m => `${m.name} - ${m.status} - ${m.target_date}`),
  ].join('\n');

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${project.name}_full_report_${new Date().toISOString().split('T')[0]}.txt`;
  link.click();
};
