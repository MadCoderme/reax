import React, { useEffect } from "react"
import { 
    Button,
    Container,
    Text, useToast, 
} from '@chakra-ui/react'
import { VscGithub } from 'react-icons/vsc'
import { GithubAuthProvider, signInWithPopup } from "firebase/auth"

import { auth, db } from "../../firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { Octokit } from "octokit"
import { SEMI_BACK } from "../../utils/colors"

const provider = new GithubAuthProvider()
provider.addScope('repo')
provider.addScope('read:user')

export default function Auth () {

    const toast = useToast()
    const navigate = useNavigate()

    useEffect(() => {
        document.title = "Authentication"
    }, [])

    const handleAuth = () => {
        signInWithPopup(auth, provider)
        .then(async(result) => {
            const credential = GithubAuthProvider.credentialFromResult(result)
            const token = credential.accessToken
            const user = result.user
            const octokit = new Octokit({ auth: token })
            console.log(token)
            const userDoc = doc(db, "users", user.uid)
            getDoc(userDoc)
                .then(async(docSnap) => {
                    if(docSnap.exists()) {
                        navigate('/dashboard')
                    } else {
                        toast({
                            title: 'Getting you ready',
                            status: 'loading',
                            duration: 2000,
                            isClosable: false,
                        })

                        const { data } = await octokit.rest.users.getAuthenticated()

                        setDoc(userDoc, {
                            accessToken: token,
                            name: data.login,
                            email: data.email
                        })
                        .then(() => {
                            updateDoc(doc(db, 'users', user.uid), {
                                list: []
                            })
                            .then(() => {
                                navigate('/dashboard')
                            })
                        })
                    }
                })

        }).catch((error) => {
            //const errorCode = error.code
            const errorMessage = error.message
            //const credential = GithubAuthProvider.credentialFromError(error);
            toast({
                title: errorMessage,
                status: 'error',
                duration: 3000,
                isClosable: false,
            })
        })
    }

    return (
        <Container minWidth="99vw" minHeight="100vh" overflowX="hidden" background={SEMI_BACK}
                display="flex" flexDir="column" justifyContent="center" alignItems="center">
                <Text color="whiteAlpha.800" mb={5} fontSize={28} fontWeight="bold">Sign in</Text>
                <Button colorScheme="blackAlpha" onClick={handleAuth}>
                    <VscGithub size={25} /> 
                    <Text ml={5}>Sign in with Github</Text>
                </Button>
        </Container>
    )
}