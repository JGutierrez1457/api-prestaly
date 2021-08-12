const authUserController ={}
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usersDAO = require('../users.dao');

authUserController.signIn = async(req, res)=>{
    const { username, password } = req.body;
    try {
        
        const existUser = await usersDAO.getUserByCondition({username});
        if(!existUser) return res.status(404).send('No existe el usuario')

        const isPasswordCorrect = await bcrypt.compare(password, existUser.password);
        if(!isPasswordCorrect) return res.status(400).send('Credenciales incorrectas')

        const token = jwt.sign({username:existUser.username, id: existUser._id},'test',{expiresIn:'1h'})
        const fullName = existUser.first_name+(existUser.last_name?(' '+existUser.last_name):(''));

        return res.status(200).json({user:{username:existUser.username,full_name: fullName, email:existUser?.email},families : existUser.families, token,message:`Bienvenido ${fullName}`})
    } catch (error) {
        return res.status(500).json({message:'Something went wrong'})
    }

}
authUserController.signUp = async(req, res)=>{
    const { username,first_name,last_name, password, confirmPassword,email } = req.body;
        try {
            const existUsername = await usersDAO.getUserByCondition({username});
            if(existUsername) return res.status(400).send('Nombre de usuario en uso');

            if(password !== confirmPassword) return res.status(400).send('Las contraseñas no coinciden');

            const salt = await  bcrypt.genSalt(10);
            const passwordHashed = await bcrypt.hash(password, salt);
            const newUser = await usersDAO.createUser(
                {username, email,password: passwordHashed,first_name, last_name });

            const token = jwt.sign({username: newUser.username, id: newUser._id},'test',{expiresIn:'1h'});
            const fullName = newUser.first_name+(last_name?(' '+newUser.last_name):(''));
            return res.status(200).json({user:{username: newUser.username,full_name: fullName, email: newUser?.email}, families: newUser.families,token,message : `Registrado con éxito ${fullName}`});
        } catch (error) {
            return res.status(500).json({message:"Something went wrong.",error:error.message})
        }
}

module.exports = authUserController;