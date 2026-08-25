const express = require('express');
const bcrypt = require('bcrypt');
const {PrismaClient} = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');

const router = express.Router();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({adapter});


router.post('/signup', async(req,res)=>{
    const {email, password, display_name} = req.body;

    //validation
    if(!email || !password){
        return res.status(400).json({error: 'your email and password is incorrect'});

    }

    try{
        //check if email exists

        const existing = await prisma.users.findUnique({ where : {email}});

        if(existing){
            return res.status(409).json({error: 'Eamil taken'})

        }

        // password hash
        const password_hash = await bcrypt.hash(password, 10);

        //create user

        const user = await prisma.users.create({
            data:{
                email,
                password_hash,
                display_name: display_name || null
            }
        });

        return res.status(201).json({
            message: 'Acoount is succesful',
            user:{
                user_id : user.user_id,
                email: user.email,
                display_name: user.display_name,
                created_at: user.created_at

            }
        })

    }catch(error){
        console.error('sign up error', error);
        return res.status(500).json({error: 'internal server error'});
    }
})

module.exports = router;