import { test, expect } from '@playwright/test';

test.describe('Collaborative Workspace', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the collaborative workspace
    await page.goto('/collaborate');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display the workspace header with project name', async ({ page }) => {
    // Check that the workspace header is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Check that the project name is displayed
    await expect(page.getByText('Social Collaboration')).toBeVisible();
  });

  test('should display the main tabs', async ({ page }) => {
    // Check that the main tabs are visible
    await expect(page.getByText('My Projects')).toBeVisible();
    await expect(page.getByText('Shared with Me')).toBeVisible();
    await expect(page.getByText('Contractor Network')).toBeVisible();
    await expect(page.getByText('Project Bids')).toBeVisible();
    await expect(page.getByText('Activity')).toBeVisible();
  });

  test('should allow switching between tabs', async ({ page }) => {
    // Click on the "Shared with Me" tab
    await page.getByText('Shared with Me').click();
    
    // Check that the tab content has changed
    await expect(page.getByText('Shared')).toBeVisible();
    
    // Click on the "Contractor Network" tab
    await page.getByText('Contractor Network').click();
    
    // Check that the tab content has changed
    await expect(page.getByText('Contractor Network')).toBeVisible();
  });

  test('should display project cards in the projects tab', async ({ page }) => {
    // Ensure we're on the projects tab
    await page.getByText('My Projects').click();
    
    // Check that project cards are visible
    const projectCards = page.locator('div.grid div.group');
    await expect(projectCards.first()).toBeVisible();
  });

  test('should allow creating a new project', async ({ page }) => {
    // Click the "New Project" button
    await page.getByText('New Project').click();
    
    // Check that the create project form is visible
    await expect(page.getByText('Create New Project')).toBeVisible();
    
    // Fill in the project name
    await page.getByLabel('Project Name').fill('Test Project');
    
    // Fill in the description
    await page.getByLabel('Description').fill('A test project for Playwright testing');
    
    // Select privacy option
    await page.getByLabel('Privacy').click();
    await page.getByText('Private - Only invited members').click();
    
    // Click the "Create Project" button
    await page.getByText('Create Project').click();
    
    // Check that the project was created
    await expect(page.getByText('Test Project')).toBeVisible();
  });

  test('should display the chat component', async ({ page }) => {
    // Click on the "Activity" tab to show the chat
    await page.getByText('Activity').click();
    
    // Check that the chat component is visible
    await expect(page.getByText('Recent Activity')).toBeVisible();
  });

  test('should display the task management component', async ({ page }) => {
    // Click on the "Project Bids" tab to show tasks
    await page.getByText('Project Bids').click();
    
    // Check that the task management component is visible
    await expect(page.getByText('No bids yet')).toBeVisible();
  });

  test('should display the file sharing component', async ({ page }) => {
    // Click on the "Shared with Me" tab to show files
    await page.getByText('Shared with Me').click();
    
    // Check that the file sharing component is visible
    await expect(page.getByText('Shared')).toBeVisible();
  });
});