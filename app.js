const expressApp = require('express');
const mysqlDriver = require('mysql2');

const serverPort = process.env.HTTP_PORT || 80;
const app = expressApp();
app.use(expressApp.json());

const dbPool = mysqlDriver.createPool({
  connectionLimit: 10,
  host: "database-1-instance-1.cf6am46smdav.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "vishnuvasita",
  database: "mydb"
});


const ensureTableExists = () => {
  dbPool.query(
    `CREATE TABLE IF NOT EXISTS products (
      name VARCHAR(100),
      price DECIMAL(10, 2),
      availability BOOLEAN
    )`,
    (err) => {
      if (err) {
        console.error('Error ensuring products table exists:', err.message);
        process.exit(1); 
      }
    }
  );
};

ensureTableExists();
app.post('/store-products', (req, res) => {
  const itemList = req.body.products;

  if (!itemList || !Array.isArray(itemList) || itemList.length === 0) {
    return res.status(400).json({ error: 'Empty!!' });
  }

  const itemsValid = itemList.every(item => {
    return (
      item && 
      typeof item.name === 'string' &&
      typeof item.price === 'string' && 
      typeof item.availability === 'boolean'
    );
  });

  if (!itemsValid) {
    return res.status(400).json({ error: 'Invalid product detail' });
  }

  dbPool.getConnection((err, dbConn) => {
    if (err) {
      console.error('Database error: ', err.message);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const insertQuery = 'INSERT INTO products (name, price, availability) VALUES ?';
    const productData = itemList.map(item => [
      item.name,
      item.price,
      item.price
    ]);

    dbConn.query(insertQuery, [productData], (error, queryResults) => {
      dbConn.release();

      if (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Database query error!' });
      }

      res.status(200).json({ message: 'Success'});
    });
  });
});

app.get('/list-products', (req, res) => {
  dbPool.getConnection((error, dbConn) => {
    if (error) {
      console.error(error.message);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const selectQuery = 'SELECT name, price, availability FROM products';

    dbConn.query(selectQuery, (queryError, productsList) => {
      dbConn.release();

      if (queryError) {
        console.error(queryError.message);
        return res.status(500).json({ error: 'Database query error!' });
      }

      const formattedProducts = productsList.map(product => ({
        name: product.name,
        price: product.price,
        availability: product.availability
      }));

      res.status(200).json({ products: formattedProducts });
    });
  });
});

app.listen(serverPort, () => {
  console.log(`Server is running on port ${serverPort}`);
});
