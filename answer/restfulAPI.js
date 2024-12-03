/* eslint-disable no-unused-vars */


// import Express เพื่อสร้าง Web Server 
import express from 'express';
// import uuid เพื่อสร้าง Unique ID ของสินค้าโดยอัตโนมัติ
import { v4 as uuidv4 } from 'uuid';
// import process เพื่อรับ port จาก environment variable
import process from 'node:process';

// สร้าง Express Application เพื่อจัดการกับ Web Server, การ Routing, การทำ Middleware
const app = express();
// เป็น Middleware ให้ Express เพื่อทำให้สามารถอ่าน JSON request body ได้
app.use(express.json());
// define products เป็น array เพื่อใช้สำหรับการจำลองฐานข้อมูล
let products = [];
// เป็น Middleware เพื่อตรวจสอบข้อมูลสินค้า ซึ่งจะทำงานก่อนการสร้างสินค้าใหม่
const validateProductData = (req, res, next) => {
    // ดึงข้อมูล name, price, category จาก request body
    const { name, price, category } = req.body;
    // ตรวจสอบว่ามีข้อมูลครบมั้ย
    if (!name || !price || !category) {
        // ถ้าหากไม่มีอันใดอันหนึ่ง จะส่ง error กลับไป
        return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน: ต้องระบุ name, price และ category' });
    }
    // ถ้าหากข้อมูลถูกต้อง จะไปยังขั้นตอนถัดไป
    next();
}

// เป็น Route เพื่อเพิ่มสินค้าใหม่
app.post('/products', validateProductData, (req, res) => {

    try {
        // ดึงข้อมูล name, price, category จาก request body และใช้ Stock = 0 หากไม่ระบุ(ป้องกันไม่ให้ stock เป็น undefined)
        const { name, price, category, stock = 0 } = req.body;
        // สร้าง Object สำหรับสินค้าใหม่
        const newProduct = {
            id: uuidv4(),
            name,
            price,
            category,
            stock,
            // บันทึกวันที่สร้าง
            createdAt: new Date(),
            // บันทึกวันที่อัปเดตล่าสุด
            updatedAt: new Date(),
        }
        // เป็นการเพิ่มสินค้าใหม่เข้าไปใน array
        products.push(newProduct);
        // ส่งข้อมูลสินค้าใหม่เข้าไปใน response ด้วย status 201
        res.status(201).json(newProduct);
    } catch (error) {
        // ถ้ามีข้อผิดพลาดในการเพิ่มสินค้า จะส่ง error แสดง "เกิดข้อผิดพลาดในการเพิ่มสินค้า" กลับไปด้วย status 500
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า' });
    }
});

// เป็น Route เพื่อแก้ไขสินค้า
app.put('/products/:id', (req, res) => {
    try {
        // ดึง id จาก request params( URL Parameter )
        const { id } = req.params;
        // ดึงข้อมูลที่ต้องการแก้ไขสินค้า จาก request body
        const { name, price, stock } = req.body;
        // หา index หรือตำแหน่งของสินค้าใน array ด้วย id
        const productIndex = products.findIndex((product) => product.id === id);
        // ตรวจสอบว่ามีสินค้าอยู่ใน array หรือไม่
        if (productIndex === -1) {
            return res.status(404).json({ error: 'ไม่พบสินค้า' });
        }
        // อัปเดตสินค้า โดยใช้ spead operator โดยจะอัปเดตข้อมูลที่มีอยู่แล้ว และเพิ่มข้อมูลที่ระบุใน request body ที่มีอยู่
        products[productIndex] = {
            // เป็นการคงค่าเดิมของสินค้า
            ...products[productIndex],
            // เป็นการอัปเดตข้อมูล name ถ้ามีอยู่
            ...(name && { name }),
            // เป็นการอัปเดตข้อมูล price ถ้ามีอยู่
            ...(price && { price }),
            // เป็นการอัปเดตข้อมูล stock ถ้ามีอยู่
            ...(stock !== undefined && { stock }),
            // บันทึกวันที่อัปเดตล่าสุด
            updatedAt: new Date(),
        }
        // ส่ง response กลับพร้อมข้อมูลสินค้าที่อัปเดตแล้ว
        res.json(products[productIndex]);
    } catch (error) {
        // ถ้ามีข้อผิดพลาดในการแก้ไขสินค้า จะส่ง error แสดง "เกิดข้อผิดพลาดในการแก้ไขสินค้า" กลับไปด้วย status 500
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า' });
    }
});

// Route เพื่อลบสินค้า
app.delete('/products/:id', (req, res) => {
    try {
        // ดึง id จาก request params( URL Parameter )
        const { id } = req.params;
        // บันทึกจำนวนสินค้าเดิมก่อนลบ
        const initialLength = products.length;
        // เป็นการลบสินค้าโดยการกรองออกจาก array ด้วยเงื่อนไขที่ id ไม่เท่ากับ id ที่ระบุ
        products = products.filter((product) => product.id !== id);
        // ตรวจสอบว่าจำนวนสินค้าใหม่มีจำนวนเท่ากับจำนวนเดิมหรือไม่
        if (products.length === initialLength) {
            // ตรวจสอบว่าลบสินค้าสำเร็จหรือไม่ ถ้าไม่สำเร็จจะส่ง error " ไม่พบสินค้า" กลับไปด้วย status 404
            return res.status(404).json({ error: 'ไม่พบสินค้า' });
        }
        // ส่ง respon สถานะ 204 กรณีลบสำเร็จ
        res.status(204).send();
    } catch (error) {
        // ถ้ามีข้อผิดพลาดในการลบสินค้า จะส่ง error แสดง "เกิดข้อผิดพลาดในการลบสินค้า" กลับไปด้วย status 500
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบสินค้า' });
    }
});

// ตั้งค่า port สำหรับ server โดยใช้ port จาก environment variable หรือถ้าไม่มีจะใช้ port 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;
// เริ่มต้นการทำงานของ server และพิมพ์ข้อความบอกว่า server ทำงานอยู่ที่ port ใด
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// ส่งค่า app กลับไปเพื่อให้สามารถเรียกใช้ได้จากอื่นๆ
export default app;
