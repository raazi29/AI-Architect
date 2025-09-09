'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Plus, Trash2, Calculator, DollarSign, Clock, LayoutDashboard, Settings } from 'lucide-react'

interface Task {
  id: string
  name: string
  cost: number
  duration: number
}

interface Expense {
  id: string
  name: string
  amount: number
}

export default function ProjectManagementPage() {
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskCost, setNewTaskCost] = useState<number | ''>('')
  const [newTaskDuration, setNewTaskDuration] = useState<number | ''>('')
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | ''>('')

  const addTask = () => {
    if (newTaskName && newTaskCost !== '' && newTaskDuration !== '') {
      setTasks([
        ...tasks,
        { id: Date.now().toString(), name: newTaskName, cost: Number(newTaskCost), duration: Number(newTaskDuration) },
      ])
      setNewTaskName('')
      setNewTaskCost('')
      setNewTaskDuration('')
    }
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const addExpense = () => {
    if (newExpenseName && newExpenseAmount !== '') {
      setExpenses([
        ...expenses,
        { id: Date.now().toString(), name: newExpenseName, amount: Number(newExpenseAmount) },
      ])
      setNewExpenseName('')
      setNewExpenseAmount('')
    }
  }

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const totalTaskCost = tasks.reduce((sum, task) => sum + task.cost, 0)
  const totalExpenseAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const grandTotal = totalTaskCost + totalExpenseAmount
  const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0)

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-2xl font-semibold">Project Management & Cost Estimation</h1>
      </header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Enter the basic information for your project.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="projectName">Project Name</label>
                <Input
                  id="projectName"
                  placeholder="e.g., Modern Kitchen Renovation"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="projectDescription">Project Description</label>
                <Textarea
                  id="projectDescription"
                  placeholder="Briefly describe the scope of the project..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks & Labor Costs</CardTitle>
              <CardDescription>Add individual tasks, their estimated costs, and durations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead className="text-right">Cost ($)</TableHead>
                    <TableHead className="text-right">Duration (days)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell className="text-right">{task.cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{task.duration}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      <Input
                        placeholder="New task name"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="Cost"
                        value={newTaskCost}
                        onChange={(e) => setNewTaskCost(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="Duration"
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Button onClick={addTask} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-end border-t p-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="h-5 w-5" />
                Total Task Cost: ${totalTaskCost.toFixed(2)}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Material & Other Expenses</CardTitle>
              <CardDescription>Add any additional expenses like materials, permits, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense Name</TableHead>
                    <TableHead className="text-right">Amount ($)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.name}</TableCell>
                      <TableCell className="text-right">{expense.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      <Input
                        placeholder="New expense name"
                        value={newExpenseName}
                        onChange={(e) => setNewExpenseName(e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Button onClick={addExpense} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-end border-t p-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="h-5 w-5" />
                Total Expenses: ${totalExpenseAmount.toFixed(2)}
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-start bg-muted/50">
              <div className="grid gap-0.5">
                <CardTitle className="group flex items-center gap-2 text-lg">
                  <Calculator className="h-5 w-5" /> Project Summary
                </CardTitle>
                <CardDescription>Overview of your project's financials and timeline.</CardDescription>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Settings</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 text-sm">
              <div className="grid gap-3">
                <div className="font-semibold">Project Overview</div>
                <ul className="grid gap-3">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Project Name</span>
                    <span>{projectName || 'N/A'}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Description</span>
                    <span>{projectDescription || 'N/A'}</span>
                  </li>
                </ul>
              </div>
              <div className="grid gap-3 mt-6">
                <div className="font-semibold">Cost Breakdown</div>
                <ul className="grid gap-3">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Task Costs</span>
                    <span>${totalTaskCost.toFixed(2)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Expenses</span>
                    <span>${totalExpenseAmount.toFixed(2)}</span>
                  </li>
                  <li className="flex items-center justify-between font-semibold border-t pt-3 mt-3">
                    <span className="text-muted-foreground">Grand Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </li>
                </ul>
              </div>
              <div className="grid gap-3 mt-6">
                <div className="font-semibold">Timeline Overview</div>
                <ul className="grid gap-3">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated Duration</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {totalDuration} days</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
              <div className="text-xs text-muted-foreground">
                Last updated: <time dateTime={new Date().toISOString()}>{new Date().toLocaleDateString()}</time>
              </div>
              <Button size="sm" variant="outline" className="ml-auto gap-1">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Export Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}