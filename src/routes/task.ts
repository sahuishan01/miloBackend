import { Router } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { NewTask, tasks } from "../db/schema";
import { eq } from "drizzle-orm";


const taskRouter = Router();

taskRouter.post("/", auth, async(req: AuthRequest, res) =>
{
    try
    {
        if (!req.user)
        {
            res.status(401).json(
                {
                    error: "User not found",
                }
            )
            return;
        }
        req.body = {...req.body, deadline: new Date(req.body.deadline), uid: req.user};
        const newTask: NewTask = req.body;
        const [task] = await db.insert(tasks).values(newTask).returning();
        res.status(201).json(task);
    }
    catch (e)
    {
        res.status(500).json({"error": e});
    }
});

taskRouter.get("/", auth, async(req: AuthRequest, res) => {
    try
    {

        if (!req.user)
        {
            res.status(401).json(
                {
                    error: "Unable to verify credentials, try logging in again!",
                }
            )
            return;
        }
        const allTasks = await db.select().from(tasks).where(eq(tasks.uid, req.user));
        res.status(200).json(allTasks);
    }
    catch (e)
    {
        res.status(500).json({error: e});
    }
})

taskRouter.delete("/", auth, async (req: AuthRequest, res) => {
    try
    {
        if (!req.user)
        {
            res.status(401).json(
                {
                    error: "Unable to verify credentials, try logging in again!",
                }
            )
            return;
        }
        const {taskId} : {taskId: string} = req.body;
        console.log(taskId);
        await db.delete(tasks).where(eq(tasks.id, taskId));
        res.status(200).json(true);
    }
    catch (e)
    {
        res.status(500).json(false);
    }
})

taskRouter.post("/sync", auth, async(req: AuthRequest, res) =>
    {
        try
        {
            const taskList = req.body;
            const filteredTasks: NewTask[] = [];
            for(let t of taskList)
            {
                t = {...t, uid: req.user, deadline: new Date(t.deadline), createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt)};
                filteredTasks.push(t);
            }
            const pushedTasks = await db.insert(tasks).values(filteredTasks).returning();
            res.status(201).json(pushedTasks);

        }
        catch (e)
        {
            res.status(500).json({"error": e});
        }
    });

export default taskRouter;