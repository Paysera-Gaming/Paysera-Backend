import { TZDate } from '@date-fns/tz';
import { formatDate, parseISO, set } from 'date-fns';
import { getHours, getMinutes, getSeconds } from 'date-fns';
import { configEnv } from './config/dotenv';
import nodemailer from 'nodemailer';
import { raiseHttpError } from './middlewares/errorHandler';


async function sample() {
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
        from: "pangilinanervin22@gmail.com",
        to: configEnv.EMAIL_USERNAME,
        subject: 'Paysera Password Reset',
        text: `You requested a password reset. Use the following link to reset your password: ${configEnv.ACCOUNT_USERNAME}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error, info, "error sending email");
        } else {
            console.log("Email sent");
        }
    });

}


function createDateFromHoursAndMinutes(date: Date): Date {
    const newDate = new TZDate(date, "Asia/Manila");

    return set(new TZDate(new Date(), "Asia/Manila"), {
        hours: getHours(newDate),
        minutes: getMinutes(newDate),
        seconds: getSeconds(newDate),
    })
}

const dateInstance = new Date();
createDateFromHoursAndMinutes(dateInstance);

interface SampleObjectParams {
    name: string;
    age: number;
    person: { fullName: string; age: number };
    address: { street: string; city: string; zipCode: number };
    contact: { email: string; phone: string };
}



sample();
