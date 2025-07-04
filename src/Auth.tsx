import {useState} from 'react';
import {supabase} from './supabase-client';

export default function Auth(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const signUp = async () => {
        const {data, error} = await supabase.auth.signUp({email, password})
        if (error) return alert(error.message);
        else {alert('Check your email for confirmation');}

        const {data:{user}} = await supabase.auth.getUser();

        if (user) {
            sessionStorage.setItem('supabaseSession', JSON.stringify(data.session));
            await supabase.from('users').upsert({
                id: user.id,
                email:user.email,

            }, {
                onConflict:'id'
            });
        }
    }

    const signIn = async () => {
        const {data, error} = await supabase.auth.signInWithPassword({email, password})
        if (error) alert(error.message);
        else sessionStorage.setItem('supabaseSession', JSON.stringify(data.session));

        const {data: {user}} = await supabase.auth.getUser();

        if (user) {
            console.log("User:", user);
            await supabase.from('users').upsert({
                id:user.id,
                email:user.email,
            }, {
                onConflict:'id'
            });
            
        }
    }

    const signInWithProvider = async (provider: 'google') => {
        const {error} = await supabase.auth.signInWithOAuth({
            provider,
            options:{
                redirectTo:window.location.origin,
            },
        });
        if (error) console.error("OAuth error:", error.message);
    }

    return (
        <div>
            <input placeholder = "Email" onChange = {(e) => setEmail(e.target.value)}/>
            <input type = "password" placeholder = "Password" onChange = {(e) => {setPassword(e.target.value)}}/>
            <button onClick = {signUp}>Sign Up</button>
            <button onClick = {signIn}>Sign In</button>
            <hr />
            <button onClick = {() => signInWithProvider('google')}>Sign in with Google</button>
            
        </div>

    )
}