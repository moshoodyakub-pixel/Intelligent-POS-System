# PostgreSQL Database Schema

## Tables:

### 1. products
- **id** (PK): Unique identifier for each product  
- **name**: Name of the product  
- **description**: Description of the product  
- **price**: Price of the product  
- **vendor_id** (FK): References the vendor of the product  

### 2. vendors
- **id** (PK): Unique identifier for each vendor  
- **name**: Name of the vendor  
- **contact_info**: Contact information for the vendor  

### 3. inventory
- **id** (PK): Unique identifier for each inventory record  
- **product_id** (FK): References the associated product  
- **quantity**: Quantity of the product in stock  
- **last_updated**: Timestamp of the last update  

### 4. customers
- **id** (PK): Unique identifier for each customer  
- **name**: Name of the customer  
- **email**: Email address of the customer  
- **phone**: Phone number of the customer  

### 5. transactions
- **id** (PK): Unique identifier for each transaction  
- **customer_id** (FK): References the customer making the transaction  
- **transaction_date**: Date of the transaction  
- **total_amount**: Total amount of the transaction  

### 6. transaction_items
- **id** (PK): Unique identifier for each transaction item  
- **transaction_id** (FK): References the associated transaction  
- **product_id** (FK): References the product being sold  
- **quantity**: Quantity of the product sold  
- **price**: Price of the product during the transaction  

### 7. users
- **id** (PK): Unique identifier for each user  
- **username**: Username for the user  
- **password_hash**: Hashed password for security  
- **role**: Role of the user (e.g., admin, staff)  

### 8. sales_forecasts
- **id** (PK): Unique identifier for each sales forecast  
- **product_id** (FK): References the product being forecasted  
- **forecast_date**: Date for the sales forecast  
- **predicted_sales**: Predicted sales amount  

## Relationships:
- **products** has a many-to-one relationship with **vendors**.  
- **inventory** has a one-to-one relationship with **products**.  
- **transactions** has a many-to-one relationship with **customers**.  
- **transaction_items** has a many-to-one relationship with **transactions** and **products**.  
- **sales_forecasts** has a many-to-one relationship with **products**.