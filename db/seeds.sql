INSERT INTO department (name) 
VALUES ('Sales'),
       ('Engineering'),
       ('Finance'),
       ('Legal');

INSERT INTO role (title, salary, department)
VALUES ('Sales Manager', 80000, 1),
       ('Sales Representative', 60000, 1),
       ('Sales Associate', 50000, 1),
       ('Software Engineer', 100000, 2),
       ('Senior Software Engineer', 120000, 2),
       ('Accountant', 70000, 3),
       ('Finance Manager', 90000, 3),
       ('Lawyer', 80000, 4),
       ('Legal Assistant', 50000, 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('John', 'Doe', 1, NULL),
       ('Jane', 'Doe', 2, 1),
       ('Jim', 'Doe', 3, 1),
       ('Jill', 'Doe', 4, 1),
       ('Jack', 'Doe', 5, 1),
       ('Jenny', 'Doe', 6, 1),
       ('Jared', 'Doe', 7, 1),
       ('Jesse', 'Doe', 8, 1),
       ('Jasmine', 'Doe', 9, 1);
       
