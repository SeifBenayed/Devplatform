module.exports = async function (context, req) {
    context.log('Upload function triggered - simplified version');

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: { message: 'Upload endpoint is alive!' }
    };
};
