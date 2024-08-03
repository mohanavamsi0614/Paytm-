const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dot = require('dotenv').config();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const HASURA_URL = process.env.HASURA_URL;
const HASURA_ADMIN_SECRET = process.env.secret;

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.sendStatus(401);

    jwt.verify(token, "SECRET_KEY", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/sign', async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const userQuery = `
    mutation ($username: String!, $password: String!) {
        insert_paytm_Users_one(object: {username: $username, password: $password}) {
            id
        }
    }`;

    const userVariables = {
        username,
        password: hashedPassword,
    };

        const userResponse = await axios.post(
            HASURA_URL,
            {
                query: userQuery,
                variables: userVariables
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
                },
            }
        );
        console.log(userResponse.data)
        const userId = userResponse.data.data.insert_paytm_Users_one.id;

        const accountQuery = `
        mutation ($userId: uuid!) {
            insert_paytm_Account_one(object: {user_id: $userId, balance: 0}) {
                id
            }
        }`;

        const accountVariables = {
            userId,
        };

        const accountResponse = await axios.post(
            HASURA_URL,
            {
                query: accountQuery,
                variables: accountVariables
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
                },
            }
        );
        console.log(accountResponse.data)
        res.json({ userId: userId, accountId: accountResponse.data.data.insert_paytm_Account_one.id });
    
})

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const query = `
    query($username: String!) {
        paytm_Users(where: {username: {_eq: $username}}) {
            id 
            password
        }
    }`;
    const variables = { username }

        const response = await axios.post(
            HASURA_URL,
            { query, variables },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
                },
            }
        );
        if (response.data.data.paytm_Users.length !== 0 && bcrypt.compareSync(password, response.data.data.paytm_Users[0].password)) {
            const token = jwt.sign({ userId: response.data.data.paytm_Users[0].id }, "SECRET_KEY");
            res.json({ message: "login Successful", token });
        } else {
            res.json({ message: "wrong password" });
        }
    
});

app.post('/deposit', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const query = `
    mutation($userId: uuid!, $amount: Int!) {
        update_paytm_Account(
            where: {user_id: {_eq: $userId}},
            _inc: {balance: $amount}
        ) {
            returning {
                balance
            }
        }
        insert_paytm_transactions_one(object: {Account_id: $userId, type: "deposit", Amount: $amount}) {
            id
        }
    }`;

    try {
        const response = await axios.post(
            HASURA_URL,
            { query, variables: { userId: req.user.userId, amount } },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
                },
            }
        );
        console.log(response.data)
        res.json(response.data.data.update_paytm_Account.returning[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/withdraw', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const query = `
    mutation($userId: uuid!, $amount: Int!) {
        update_paytm_Account(
            where: {user_id: {_eq: $userId}},
            _set: {balance: $amount}
        ) {
            returning {
                balance
            }
        }
        insert_paytm_transactions_one(object: {Account_id: $userId, type: "withdrawal", Amount: $amount}) {
            id
        }
    }`;

    try {
        const response = await axios.post(
            HASURA_URL,
            {
                query,
                variables: { userId: req.user.userId, amount }
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
                },
            }
        );
        console.log(response.data)
        res.json(response.data.data.update_paytm_Account.returning[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('running on port 3000');
});
