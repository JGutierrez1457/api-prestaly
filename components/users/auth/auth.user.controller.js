const authUserController ={}
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usersDAO = require('../users.dao');

authUserController.signIn = async(req, res)=>{
    const { username, password } = req.body;
    try {
        
        const existUser = await usersDAO.getUserByUsername(username);
        if(!existUser) return res.status(404).json({message:"User don't exist"})

        const isPasswordCorrect = await bcrypt.compare(password, existUser.password);
        if(!isPasswordCorrect) return res.status(400).json({message:"Credentials incorrects"})

        const token = jwt.sign({username:existUser.username, id: existUser._id},'test',{expiresIn:'1h'})

        return res.status(200).json({result:{username:existUser.username,full_name:existUser.first_name+(existUser.last_name?(' '+existUser.last_name):('')), email:existUser?.email, families: existUser.families}, token,message:{severity:'success',text:'Sign In Successfully'}})
    } catch (error) {
        return res.status(500).json({message:'Something went wrong'})
    }

}
authUserController.signUp = async(req, res)=>{
    const { username,first_name,last_name, password, confirmPassword,email } = req.body;
        try {
            const existUsername = await usersDAO.getUserByUsername(username);
            if(existUsername) return res.status(400).json({message:{severity:'warning',text:'Username in use.'}});

            if(password !== confirmPassword) return res.status(400).json({message:{severity:'warning',text:"Passwords don't match"}});

            const salt = await  bcrypt.genSalt(10);
            const passwordHashed = await bcrypt.hash(password, salt);
            const newUser = await usersDAO.createUser(
                {username, email,password: passwordHashed,first_name, last_name });

            const token = jwt.sign({username: newUser.username, id: newUser._id},'test',{expiresIn:'1h'});
    
            return res.status(200).json({result:{username: newUser.username,full_name:newUser.first_name+(last_name?(' '+newUser.last_name):('')), email: newUser?.email, families: newUser.families},token,message:{severity:'success',text:'Sign Up Successfully'}});
        } catch (error) {
            console.log(error)
            return res.status(500).json({message:"Something went wrong.",error:error.message})
        }
}

module.exports = authUserController;