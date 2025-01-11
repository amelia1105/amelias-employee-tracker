// import node, inquirer, and postgresql
import inquirer from 'inquirer';
import { QueryResult } from 'pg';
import { pool, connectToDb } from './connection.js';

await connectToDb();

// create a main menu function that will prompt the user with a list of options
const mainMenu = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Exit'
      ]
    }
  ]);

  // when a user selects an option, call the appropriate function, then return to the main menu
  switch (answers.action) {
    case 'View all departments':
      await viewAllDepartments();
      break;
    case 'View all roles':
      await viewAllRoles();
      break;
    case 'View all employees':
      await viewAllEmployees();
      break;
    case 'Add a department':
      await addDepartment();
      break;
    case 'Add a role':
      await addRole();
      break;
    case 'Add an employee':
      await addEmployee();
      break;
    case 'Update an employee role':
      await updateEmployeeRole();
      break;
    case 'Exit':
      console.log('Goodbye!');
      process.exit();
  }

  mainMenu();
};

// function to view all departments
const viewAllDepartments = async () => {
  const result: QueryResult = await pool.query('SELECT * FROM department');
  console.table(result.rows);
};

// function to view all roles
const viewAllRoles = async () => {
  const result: QueryResult = await pool.query('SELECT * FROM role');
  console.table(result.rows);
};

// function to view all employees
const viewAllEmployees = async () => {
  const result: QueryResult = await pool.query('SELECT * FROM employee');
  console.table(result.rows);
};

// function to add a department
const addDepartment = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of the department:',
      validate: (input) => {
        if (/^[a-zA-Z\s]+$/.test(input)) {
          return true;
        }
        return 'Department name is not valid.';
      }
    }
  ]);

  await pool.query('INSERT INTO department (name) VALUES ($1)', [answers.name]);
  console.log(`Added department: ${answers.name}`);
};

// function to add a role
const addRole = async () => {
  const departments: QueryResult = await pool.query('SELECT id, name FROM department');
  const departmentChoices = departments.rows.map(department => ({
    name: department.name,
    value: department.id
  }));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Enter the title of the role:',
      validate: (input) => {
        if (/^[a-zA-Z\s]+$/.test(input)) {
          return true;
        }
        return 'Title is not valid.';
      }
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Enter the salary of the role:',
      validate: (input) => {
        if (/^[0-9]+$/.test(input)) {
          return true;
        }
        return 'Salary is not valid.';
      }
    },
    {
      type: 'list',
      name: 'department_id',
      message: 'Which department does the role belong in?',
      choices: departmentChoices
    }
  ]);

  await pool.query('INSERT INTO role (title, salary, department) VALUES ($1, $2, $3)', [answers.title, answers.salary, answers.department_id]);
  console.log(`Added role: ${answers.title}`);
};

// function to add an employee
const addEmployee = async () => {
  const roles: QueryResult = await pool.query('SELECT id, title FROM role');
  const roleChoices = roles.rows.map(role => ({
    name: role.title,
    value: role.id
  }));

  const managers: QueryResult = await pool.query('SELECT id, first_name, last_name FROM employee');
  const managerChoices = managers.rows.map(manager => ({
    name: `${manager.first_name} ${manager.last_name}`,
    value: manager.id
  }));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'first_name',
      message: 'Enter the first name of the employee:',
      validate: (input) => {
        if (/^[a-zA-Z\s]+$/.test(input)) {
          return true;
        }
        return 'First name is not valid.';
      }
    },
    {
      type: 'input',
      name: 'last_name',
      message: 'Enter the last name of the employee:',
      validate: (input) => {
        if (/^[a-zA-Z\s]+$/.test(input)) {
          return true;
        }
        return 'Last name is not valid.';
      }
    },
    {
      type: 'list',
      name: 'role_id',
      message: 'Select the employee\'s role:',
      choices: roleChoices
    },
    {
      type: 'list',
      name: 'manager_id',
      message: 'Select the employee\'s manager:',
      choices: managerChoices
    },
  ]);

  await pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [answers.first_name, answers.last_name, answers.role_id, answers.manager_id || null]);
  console.log(`Added employee: ${answers.first_name} ${answers.last_name}`);
};

// function to update an employee role
const updateEmployeeRole = async () => {
  const roles: QueryResult = await pool.query('SELECT id, title FROM role');
  const roleChoices = roles.rows.map(role => ({
    name: role.title,
    value: role.id
  }));

  const employees: QueryResult = await pool.query('SELECT id, first_name, last_name FROM employee');
  const employeeChoices = employees.rows.map(employee => ({
    name: `${employee.first_name} ${employee.last_name}`,
    value: employee.id
  }));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'employee_id',
      message: 'Select the employee you want to update:',
      choices: employeeChoices
    },
    {
      type: 'list',
      name: 'role_id',
      message: 'Select the new role for the employee:',
      choices: roleChoices
    }
  ]);

  await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [answers.role_id, answers.employee_id]);
  console.log(`Updated employee\'s role.`);
};

// function to update employee managers

// function to view employees by manager

// function to view employees by department

// function to delete departments

// function to delete roles

// function to delete employees

// function to view the total utilized budget of a department (combined salaries of all employees in that department)


// call the main menu function to start the program
mainMenu();
