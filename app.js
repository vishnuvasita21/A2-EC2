const express = require('express');
const mySql = require('mysql2/promise');

const app = express();
app.use(express.json());

const port = 80;

const dbPool = mySql.createPool({
  connectionLimit: 10,
  host: "database-1-instance-1.cf6am46smdav.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "vishnuvasita",
  database: "mydb"
});



// GET

app.get('/list-products', async (req, res, next) => {

  try{

  const result = await dbPool.query('SELECT name, price, availability FROM products');

  const products = result[0].map((product)=>({
    name: product.name,
    price: product.price,
    availability:  product.availability === 1 ? true : false
  })
   
  );
  console.log(products);

  res.status(200).json({ products });
}catch(err){
  res.status(500).send("Error getting product list");
}
  
});



// POST

app.post('/store-products', async (req, res, next) => {

  const productList = req.body.products;

  if (productList.length === 0) {
    return res.status(400).json({ error: 'Product list is empty.' });
  }

  //checking valid headers
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

  
    const insertProductList = productList.map((product) => [
      product.name,
      product.price,
      product.availability
    ]
    );


    // Insert each products from the array
    const responseResult = await dbPool.query('INSERT INTO products (name, price, availability) VALUES ?', [insertProductList])
   
    res.status(200).json({ message: 'Success.' });
});

  
// For any other route

app.all('*', (res) => {
  res.status(501).json({ error: 'Method not implemented' });
});

// port running

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
