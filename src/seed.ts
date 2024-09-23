import { prisma } from "./config/database";

import bcrypt from 'bcryptjs';
import { configEnv } from "./config/dotenv";

const saltRounds = configEnv.SALT_ROUNDS;
const accountUserName = configEnv.ACCOUNT_USERNAME;
const password = configEnv.ACCOUNT_PASSWORD;
const hashPasswordA = bcrypt.hashSync(password, saltRounds);

async function run() {

    const admin = await prisma.employee.findFirst({
        where: {
            username: accountUserName
        }
    });

    if (admin) {
        console.log('Admin already exists');
        return;
    }

    const admin1 = await prisma.employee.create({
        data: {
            username: accountUserName,
            accessLevel: 'ADMIN',
            isActive: true,
            passwordCredentials: hashPasswordA,
            firstName: 'Ervin',
            lastName: 'Pangilinan',
            middleName: 'Capili',
            role: 'DEVELOPER',
            LeadsDepartment: {
                create: {
                    name: 'Development Department',
                }
            }
        },
    });

    console.log(admin1);
    console.log('Admin created successfully');
}

run();