// import node, inquirer, and postgresql
import inquirer from 'inquirer';
import { QueryResult } from 'pg';
import { pool, connectToDb } from './connection.js';
import Table from 'cli-table3';

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
        'Update an employee\'s role',
        'Update an employee\'s manager',
        'View employees by manager',
        'View employees by department',
        'View roles by department',
        'View department budget',
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
    case 'Update an employee\'s role':
      await updateEmployeeRole();
      break;
    case 'Update an employee\'s manager':
      await updateEmployeeManager();
      break;
    case 'View employees by manager':
      await viewEmployeesByManager();
      break;
    case 'View employees by department':
      await viewEmployeesByDepartment();
      break;
    case 'View roles by department':
      await viewRolesByDepartment();
      break;
    case 'View department budget':
      await viewDepartmentBudget();
      break;
    case 'Exit':
      console.log('Goodbye!');
      process.exit();
  }

  mainMenu();
};

// function to view all departments
const viewAllDepartments = async () => {
  try {
    const result: QueryResult = await pool.query('SELECT id, name FROM department');

    // headers for the table
    const headers = ['ID', 'Name'];

    // table instance with rows
    const table = new Table({ head: headers });
    result.rows.forEach(({ id, name }) => {
      table.push([id, name]);
    });

    // display the table
    console.log(table.toString());
  } catch (error) {
    console.error('Error fetching departments');
  }
};

// function to view all roles
const viewAllRoles = async () => {
  try {
    // Join the role table with the department table to get the department name
    const result: QueryResult = await pool.query(`
      SELECT 
        r.id, 
        r.title, 
        r.salary, 
        d.name AS department
      FROM role r
      LEFT JOIN department d ON r.department = d.id
    `);
    
    // Define headers for the table
    const headers = ['ID', 'Title', 'Salary', 'Department'];

    // Create a table instance and add rows
    const table = new Table({ head: headers });
    result.rows.forEach(({ id, title, salary, department }) => {
      table.push([id, title, salary, department]);
    });

    // Display the table
    console.log(table.toString());
  } catch (error) {
    console.error('Error fetching roles');
  }
};

// function to view all employees
const viewAllEmployees = async () => {
  try {
    // Join the employee table with the role and department tables to get the department name and salary
    const result: QueryResult = await pool.query(`
      SELECT 
        e.id, 
        e.first_name, 
        e.last_name, 
        r.title AS role, 
        r.salary, 
        d.name AS department,
        m.first_name AS manager_first_name,
        m.last_name AS manager_last_name
      FROM employee e
      LEFT JOIN role r ON e.role_id = r.id
      LEFT JOIN department d ON r.department = d.id
      LEFT JOIN employee m ON e.manager_id = m.id
    `);
    
    // Define headers for the table
    const headers = ['ID', 'First Name', 'Last Name', 'Role', 'Salary', 'Department', 'Manager'];

    // Create a table instance and add rows
    const table = new Table({ head: headers });
    result.rows.forEach(({ id, first_name, last_name, role, salary, department, manager_first_name, manager_last_name }) => {
      const managerName = manager_first_name && manager_last_name ? `${manager_first_name} ${manager_last_name}` : 'None';
      table.push([id, first_name, last_name, role, salary, department, managerName]);
    });

    // Display the table
    console.log(table.toString());
  } catch (error) {
    console.error('Error fetching employees');
  }
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
const updateEmployeeManager = async () => {
  const employees: QueryResult = await pool.query('SELECT id, first_name, last_name FROM employee');
  const employeeChoices = employees.rows.map(employee => ({
    name: `${employee.first_name} ${employee.last_name}`,
    value: employee.id
  }));

  const managers: QueryResult = await pool.query('SELECT id, first_name, last_name FROM employee');
  const managerChoices = managers.rows.map(manager => ({
    name: `${manager.first_name} ${manager.last_name}`,
    value: manager.id
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
      name: 'manager_id',
      message: 'Select the new manager for the employee:',
      choices: managerChoices
    }
  ]);

  await pool.query('UPDATE employee SET manager_id = $1 WHERE id = $2', [answers.manager_id, answers.employee_id]);
  console.log(`Updated employee\'s manager.`);
};

// function to view employees by manager
const viewEmployeesByManager = async () => {
  const managers: QueryResult = await pool.query('SELECT id, first_name, last_name FROM employee');
  const managerChoices = managers.rows.map(manager => ({
    name: `${manager.first_name} ${manager.last_name}`,
    value: manager.id
  }));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'manager_id',
      message: 'Select the manager to view employees:',
      choices: managerChoices
    }
  ]);

  const result: QueryResult = await pool.query('SELECT * FROM employee WHERE manager_id = $1', [answers.manager_id]);
  console.table(result.rows, ['first_name', 'last_name']);
};

// function to view employees by department
const viewEmployeesByDepartment = async () => {
  const departments: QueryResult = await pool.query('SELECT id, name FROM department');
  const departmentChoices = departments.rows.map(department => ({
    name: department.name,
    value: department.id
  }));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'department_id',
      message: 'Select a department to view employees:',
      choices: departmentChoices
    }
  ]);

  const result: QueryResult = await pool.query('SELECT * FROM employee JOIN role ON employee.role_id = role.id JOIN department ON role.department = department.id WHERE department = $1', [answers.department_id]);
  console.table(result.rows, ['first_name', 'last_name']);
};

// view roles in a department. Not a bonus nor part of the graded criteria, but it helped me understand how to figure out the budget.
const viewRolesByDepartment = async () => {
  const departments: QueryResult = await pool.query('SELECT id, name FROM department');
  const departmentChoices = departments.rows.map(department => ({
    name: department.name,
    value: department.id
  }));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'department_id',
      message: 'Select a department to view roles:',
      choices: departmentChoices
    }
  ]);

  const result: QueryResult = await pool.query('SELECT * FROM role WHERE department = $1', [answers.department_id]);
  console.table(result.rows);
};

// function to view the total utilized budget of a department (combined salaries of all employees in that department)
const viewDepartmentBudget = async () => {
  const departments: QueryResult = await pool.query('SELECT id, name FROM department');
  const departmentChoices = departments.rows.map(department => ({
    name: department.name,
    value: department.id
  }));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'department_id',
      message: 'Select a department to view the total utilized budget:',
      choices: departmentChoices
    }
  ]);

  const result: QueryResult = await pool.query('SELECT SUM(salary) FROM role WHERE department = $1', [answers.department_id]);
  console.log(`Total utilized budget for department: ${result.rows[0].sum}`);
};

// call the main menu function to start the program
mainMenu();
