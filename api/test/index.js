module.exports = async function (context, req) {
    context.log('Test function triggered');

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: { message: 'API is working!' }
    };
};
