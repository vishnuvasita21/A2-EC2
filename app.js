const express = require('express');
const mySql = require('mysql2');

const app = express();
app.use(express.json());

const port = process.env.HTTP_PORT || 80;

const dbPool = mySql.createPool({
  host: "database-1-instance-1.cf6am46smdav.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "vishnuvasita",
  database: "mydb"
});



// GET

app.get('/list-products', (req, res) => {
  dbPool.getConnection((DatabaseError, dbConnection) => {

    dbConnection.query('SELECT name, price, availability FROM products', (queryError, productsList) => {
      dbConnection.release();

      if (queryError || DatabaseError) {
        return res.status(500).json({ error: "Wrong query or Database error" });
      }

      const resultProductList = productsList.map(product => ({
        name: product.name,
        price: product.price,
        availability: product.availability === 1 ? true : false
      }));

      res.status(200).json({ products: resultProductList });
    });
  });
});



// POST

app.post('/store-products', (req, res) => {

  const productList = req.body.products;

  if (productList.length === 0) {
    return res.status(400).json({ error: 'Product list is empty.' });
  }

  const isProductValid = productList.every(product => {
    if (typeof product.name === 'string' && product.name.trim() !== '' && typeof product.price === 'string' && product.price.trim() !== '' && typeof product.availability === 'boolean' && product) {
      console.log(product);
      return true;
    }
    return false;

  });

  if (!isProductValid) {
    return res.status(400).json({ error: 'Invalid product detail' });
  }

  dbPool.getConnection((err, dbConnection) => {
    if (err) {
      console.log(err.message);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    dbConnection.query(
      `CREATE TABLE IF NOT EXISTS products (
        name VARCHAR(100),
        price VARCHAR(100),
        availability BOOLEAN
      )`,
      (err) => {
        dbConnection.release();
        if (err) {
          console.log('Table already exists', err.message);
        }
      }
    );

    productList.forEach(product => {
      dbConnection.query('INSERT INTO products (name, price, availability) VALUES (?, ?, ?)', [product.anme, product.price, product.availability], (queryError) => {
        if (queryError) {
          return res.status(500).json({ error: 'Inavid sql query'});
        }
      });
    });
    dbConnection.release();
    res.status(200).json({ message: 'Success.' });
  });
});

// For any other route

app.all('*', (res) => {
  res.status(501).json({ error: 'Method not implemented' });
});

// port running

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
