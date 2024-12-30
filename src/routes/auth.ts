import { raw, Response, Router } from "express";
import { Request } from "express";
import { db } from "../db";
import { NewUser, users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { auth, AuthRequest } from "../middleware/auth";

const authRouter = Router();

interface SignUp {
    name: string,
    email: string,
    password: string,
}

interface Login {
    email: string,
    password: string,
}


authRouter.post("/signup", async (req: Request<{}, {}, SignUp>, res: Response) => {
    try {
        console.log(req.body);
        // get req body
        // check if user exists
        const {name, email, password} = req.body;
        console.log(req.body);
        const existingUsers = await db.select().from(users).where(eq(users.email, email));
        if (existingUsers.length)
        {
            res.status(400).json({
                error: "User with the same email exists"
            });
            return;
        }
        // hash the password
        const hashedPass = await bcryptjs.hash(password, 16);
        // create user  and store it in db
        const user: NewUser = {
            name,
            email,
            password: hashedPass,
        }
        const [newUser] = await db.insert(users).values(user).returning();
        res.status(201).json(newUser);
    }
    catch (e) {
        res.status(500).json(
            {
                error: e
            }
        )
    }
});


authRouter.post("/login", async (req: Request<{}, {}, Login>, res: Response) => {
    try {
        console.log(req.body);
        // get req body
        // check if user exists
        const {email, password} = req.body;
        const existingUsers = await db.select().from(users).where(eq(users.email, email));
        if (!existingUsers.length)
        {
            res.status(400).json({
                error: "User does not exist"
            });
            return;
        }
        // hash the password
        const hashedPass = await bcryptjs.compare(password, existingUsers[0].password);
        if (hashedPass)
        {
            const token = jwt.sign( {id: existingUsers[0].id}, process.env.JWT_SECRET!);
            res.status(200).json({token, ...existingUsers[0]});
        }
        else
        {
            res.status(400).json({
                error: "Incorrect password!"
            })
        }
    }
    catch (e) {
        res.status(500).json(
            {
                error: e
            }
        )
    }
});

authRouter.post("/validateToken", async (req, res) => {
    try {
        // get header
        const token = req.header('x-auth-token');

        if(!token)
        {
            res.status(400).json(false);
            return;
        }
        // verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET!);

        if (!verified)
        {
            res.status(400).json(false);
            return;
        }

        // get user data if user is valid
        const verifiedToken = verified as { id: string};
        const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, verifiedToken.id));        
        if (!user)
        {
            res.status(400).json(false);
            return;
        }
        res.status(200).json(true);
    }
    catch (e)
    {
        res.status(500).json(false);
    }
});

authRouter.get("/", auth, async (req: AuthRequest, res) => {
    try {
        if (!req.user)
        {
            res.status(401).json(
                {
                    error: "User not found",
                }
            )
            return;
        }
        const [user] = await db.select().from(users).where(eq(users.id, req.user));

        if (!user)
        {
            res.status(401).json(
                {
                    error: "User not found",
                }
            )
            return;
        }

        res.status(200).json(
            {...user, token: req.header('x-auth-token')}
        );
    }
    catch (e)
    {
        res.status(500).json({
            error: "Something went wrong: " + e,
        });
    }
});

export default authRouter;