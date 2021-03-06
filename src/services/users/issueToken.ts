import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from "../../models/user";
import { HTTP401Error, HTTP500Error,} from './../../utils/httpErrors';


const issueToken = (req: Request, res: Response) => {
    const username = req.body.username as string;
    const password = req.body.password as string;

    console.log("auth---------------")

    User.findOne({username}, (err, user) => {
        if (!err && user) {
            // We could compare passwords in our model instead of below
            bcrypt.compare(password, user.password).then(match => {
                if (match) {
                    const status = 200;

                    // Create a token
                    const payload = {
                        username: user.username
                    };
                    const options = {
                        expiresIn: process.env.TOKEN_TTL,
                        issuer:  process.env.TOKEN_ISSUER,
                        algorithm:  "RS256"
                    };
                    const key = fs.readFileSync( path.join( __dirname, "../../../private.key"), "utf-8");
                    const token = jwt.sign(payload, key, options);

                    res.status(status).send({token, status});
                } else {
                    console.log("invalid password")
                    new HTTP401Error(res, "Authentication error");
                }
            }).catch( (err) => {
                console.log(err);
                new HTTP500Error(res, "Error authenticating user.");
            });
        } else {
            console.log("unrecognized user")
            new HTTP401Error(res, "Invalid username/password");
        }
    });
}

export default issueToken;
