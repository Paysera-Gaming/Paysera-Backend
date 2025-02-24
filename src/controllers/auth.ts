import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { validateLogin } from '../validation/auth.validation';
import { raiseHttpError } from '../middlewares/errorHandler';
import { configEnv } from '../config/dotenv';
import nodemailer from 'nodemailer';
import { EmployeeService } from '../services/employee.service';
import { DepartmentService } from '../services/department.service';

const JWT_SECRET = configEnv.JWT_SECRET;
const JWT_EXPIRATION = '12h';
const REFRESH_TOKEN_EXPIRATION = '7d';

// Function to generate an access token
const generateAccessToken = (user: any) => {
    return jwt.sign(
        {
            id: user.id,
            accessLevel: user.accessLevel,
            departmentId: user.departmentId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
};

// Function to generate a refresh token
const generateRefreshToken = (user: any) => {
    return jwt.sign(
        {
            id: user.id,
        },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRATION }
    );
};

const login = async (req: Request, res: Response) => {
    const body = {
        username: req.body.username.trim(),
        password: req.body.password.trim(),
    };

    const { username, password } = validateLogin(body);
    const user = await EmployeeService.getEmployeeByUserNameAuth(username);

    if (!user || !(await bcrypt.compare(password, user.passwordCredentials))) {
        return raiseHttpError(404, "Invalid username or password");
    }

    // Generate both access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set the refresh token in a secure, HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: (configEnv.NODE_ENV === 'production' || configEnv.NODE_ENV === 'development'),
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        sameSite: 'none',
    });

    // Send the access token in a cookie (12 hours)
    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: (configEnv.NODE_ENV === 'production' || configEnv.NODE_ENV === 'development'),
        maxAge: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
        sameSite: 'none',
    });

    res.status(200).send("Login successful");
};

const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return raiseHttpError(401, "Unauthorized");
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: number };

        // Find the user
        const user = await EmployeeService.getEmployeeById(decoded.id);

        if (!user) {
            return raiseHttpError(404, "User not found");
        }

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: (configEnv.NODE_ENV === 'production' || configEnv.NODE_ENV === 'development'),
            maxAge: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
            sameSite: 'none',
        });

        res.status(200).send("Access token refreshed");
    } catch (error) {
        return raiseHttpError(401, "Invalid refresh token");
    }
};

const logout = async (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: (configEnv.NODE_ENV === 'production' || configEnv.NODE_ENV === 'development') || true,
        sameSite: 'none',
    });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: (configEnv.NODE_ENV === 'production' || configEnv.NODE_ENV === 'development') || true,
        sameSite: 'none',
    });

    res.status(200).send("Logout successful");
};

const getUserInfo = async (req: Request, res: Response) => {
    const token = req.cookies.token;

    if (!token) {
        return raiseHttpError(401, "Unauthorized cookie not found");
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET) as { id: number, accessLevel: string, departmentId: number };
        const employee = await EmployeeService.getEmployeeById(decodedToken.id);


        if (!employee) {
            return raiseHttpError(404, "Account not found");
        }

        const department = await DepartmentService.getDepartmentById(employee.departmentId || -1);
        // this can be extend if we going to add another schedule type
        let departmentSchedule;
        if (department && employee.role && employee.departmentId) {
            departmentSchedule = await prisma.departmentSchedule.findFirst({
                where: {
                    departmentId: employee.departmentId,
                    role: employee.role,
                },
                select: {
                    name: true,
                    role: true,
                    Schedule: true,
                },
            });

            departmentSchedule = { ...departmentSchedule, ...departmentSchedule?.Schedule };
        }

        const personalSchedule = await prisma.personalSchedule.findFirst({
            where: {
                employeeId: employee.id,
            },
            select: {
                day: true,
                name: true,
                Schedule: true,
            },
        });

        res.status(200).send({ ...employee, departmentName: department?.name || 'N/A', departmentSchedule, personalSchedule });
    } catch (error) {
        return raiseHttpError(401, "Invalid token");
    }
};


async function sendForgetPasswordEmail(req: Request, res: Response) {
    const { email } = req.body;

    const user = await prisma.employee.findFirst({
        where: { email: email.trim() },
    });

    if (!user) {
        return raiseHttpError(404, "Email not exists");
    }

    const forgetPasswordToken = jwt.sign(
        {
            id: user.id,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    const resetPasswordUrl = `${'https://x3lkcvjr-5173.asse.devtunnels.ms'}/reset-password?token=${forgetPasswordToken}`;

    console.log({
        user: configEnv.EMAIL_USERNAME,
        pass: configEnv.EMAIL_PASSWORD,
    });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: configEnv.EMAIL_USERNAME,
            pass: configEnv.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: configEnv.EMAIL_USERNAME,
        to: email,
        subject: 'Paysera Password Reset',
        text: `You requested a password reset. Use the following link to reset your password: ${resetPasswordUrl}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error, info, "error sending email");

            return raiseHttpError(500, "Error sending email");
        } else {
            res.status(200).send("Password reset email sent");
        }
    });
}

async function resetPassword(req: Request, res: Response) {
    const { id } = req.params;
    const password: string = req.body.password;

    console.log(req.body, req.params, req.query);


    if (!id || !password) {
        return raiseHttpError(400, "Token and password are required");
    }

    try {
        const decoded = jwt.verify(id, JWT_SECRET) as { id: number };
        const hashedPassword = await bcrypt.hash(password.trim(), 10);

        const existingEmployee = await EmployeeService.getEmployeeById(decoded.id);

        if (!existingEmployee) {
            return raiseHttpError(404, "Employee not found");
        }

        await EmployeeService.updateEmployee(decoded.id, { password: hashedPassword });

        res.status(200).send("Password reset successful");
    } catch (error) {
        return raiseHttpError(401, "Invalid token");
    }
}

export {
    login,
    refreshToken,
    logout,
    getUserInfo,
    sendForgetPasswordEmail,
    resetPassword
};
