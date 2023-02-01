import React, { useEffect, useState } from "react"
import { 
    Tabs, TabList, TabPanels, Tab, TabPanel, 
    Container, 
    Text,
    Button,
    useToast,
    Skeleton,
    Stack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    FormControl,
    FormLabel,
    Input,
    ModalFooter,
    useDisclosure,
    Card,
    CardBody,
    Box
} from '@chakra-ui/react'
import { SEMI_BACK } from "../../utils/colors"
import { auth, db } from "../../firebase"
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { useNavigate, useSearchParams } from "react-router-dom"
import { onAuthStateChanged, signOut } from "firebase/auth"
import ShortUniqueId from "short-unique-id"
import { Octokit } from "octokit"
import { VscGithub, VscLinkExternal } from "react-icons/vsc"


//openai: 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
export default function Dashboard ({ onNewProject }) {
    const navigate = useNavigate()
    const toast = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [loading, setLoading] = useState(true)
    const [userInfo, setUserInfo] = useState(null)
    const [projects, setProjects] = useState([])

    useEffect(() => {
        document.title = "Dashboard"
        onAuthStateChanged(auth, (user) => {
            if(!user) {
                navigate('/auth')
            } else {
                if(searchParams.get('newProject') === 'true') {
                    onOpen()
                }

                getDoc(doc(db, 'users', user.uid))
                    .then(docSnap => {
                        setUserInfo(docSnap.data())
                    })
                getDoc(doc(db, 'projects', user.uid))
                    .then(docSnap => {
                        if(docSnap.exists()) {
                            setProjects(docSnap.data().list)
                        }
    
                        setLoading(false)
                    })
            }
        })
    }, [])

    const handleAccountUpdate = () => {
        updateDoc(doc(db, 'users', auth.currentUser.uid), {
            openaiAPI: userInfo?.openaiAPI
        })
        .then(() => {
            toast({
                title: 'Settings updated',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
        })
    }

    const handleProjectCreation = async() => {
        const repo = document.getElementById('repo-input').value
        const branch = document.getElementById('branch-input').value

        const id = new ShortUniqueId({
            length: 5
        })()
        
        const octokit = new Octokit({auth: userInfo?.accessToken})
        const {
            data: { login },
        } = await octokit.rest.users.getAuthenticated()
        

        try {
            const { data } = await octokit.rest.repos.listCommits({
                owner: login,
                repo,
                sha: branch
            })
            
            if(data?.length > 0) {
                updateDoc(doc(db, 'projects', auth.currentUser.uid), {
                    list: arrayUnion({
                        repo,
                        branch, 
                        id
                    })
                })
                .then(async() => {
                    toast({
                        title: 'Setting up new workspace',
                        status: 'loading',
                        duration: 2000,
                        isClosable: true,
                    })
                   
                    fetch(`http://localhost:5000/newProject?name=${repo}&id=${id}`)
                        .then(response => response.json())
                        .then(responseJson => {
                            if(responseJson?.res === 'success') {
                                setTimeout(() => {
                                    onNewProject(id)
                                    navigate('/editor?app=' + id)
                                }, 5000)
                            }
                        })
                })
            } else {
                toast({
                    title: 'Repository is not Initialized. Please make the first one commit manually',
                    status: 'error',
                    duration: 5000,
                })
            }
        } catch(e) {
            if(e.status === 404) {
                toast({
                    title: 'Repository Not Found',
                    status: 'error',
                    duration: 3000,
                })
            }
        }
        
    }

    return (
        <Container minWidth="99vw" minHeight="100vh" overflowX="hidden" background={SEMI_BACK}>
            <Text color="cyan.500" fontSize={30} mt={5}
                cursor="pointer" onClick={() => navigate('/')}>Reax</Text>
            <Tabs colorScheme="cyan" mt={10} width="100%">
                    <TabList width="100%">
                        <Tab color="whiteAlpha.500" _selected={{color: 'whiteAlpha.900'}}>Projects</Tab>
                        <Tab color="whiteAlpha.500" _selected={{color: 'whiteAlpha.900'}}>Settings</Tab>
                        <Tab color="whiteAlpha.500" _selected={{color: 'whiteAlpha.900'}}>Account</Tab>
                    </TabList>

                    <TabPanels width="100%">
                        <TabPanel width="100%" display="flex" flexDirection="column">
                            <Button colorScheme="cyan" alignSelf="flex-end" mb={10} onClick={onOpen}>
                                + New Project
                            </Button> 

                            <Skeleton height='100px' 
                                startColor="whiteAlpha.100" endColor="whiteAlpha.300" 
                                isLoaded={!loading} fadeDuration={2}>

                                {projects?.length > 0 ? 
                                    projects.map((i, v) => (
                                        <Card key={i.id} mb={3} background="gray.700" p={3}>
                                            <CardBody display="flex" width="100%">
                                                <div>
                                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                                        <VscGithub color="white" style={{marginRight: 10}} /> 
                                                        <Text color="whiteAlpha.900">
                                                            {i.repo}
                                                        </Text>
                                                    </div>
                                                    <Text color="whiteAlpha.700" ml={1} mt={2}>apps/{i.id}</Text>
                                                </div>
                                                <Box position="absolute" right={8} display="flex" flexDir="column">
                                                    <Button variant="outline" colorScheme="cyan"
                                                            onClick={() => navigate('/editor?app=' + i.id)}>
                                                        Open in Editor
                                                    </Button>
                                                    <Button variant="link" colorScheme="cyan" display="block" mt={2} mr={2}
                                                        alignSelf="flex-end"
                                                        onClick={() => window.open('/apps/' + i.id)}>
                                                        View <VscLinkExternal 
                                                            style={{ display: 'inline-block' }} />
                                                    </Button>
                                                </Box>
                                            </CardBody>
                                        </Card>
                                    ))
                                : 
                                <Text color="whiteAlpha.600" textAlign="center" fontSize={20}>
                                    Nothing to show. Start off by creating a New Project
                                </Text>}

                            </Skeleton>

                            <Modal
                                isOpen={isOpen}
                                onClose={onClose}
                            >
                                <ModalOverlay />
                                <ModalContent background="gray.800">
                                    <ModalHeader color="whiteAlpha.600">Create Project</ModalHeader>
                                    <ModalCloseButton />
                                    <ModalBody pb={6}>
                                        <FormControl>
                                            <FormLabel color="whiteAlpha.500">Github Repository Name</FormLabel>
                                            <Input placeholder='reax-test' id="repo-input" color="whiteAlpha.700" />
                                        </FormControl>

                                        <FormControl mt={4}>
                                            <FormLabel color="whiteAlpha.500">Branch</FormLabel>
                                            <Input placeholder='main' id="branch-input" color="whiteAlpha.700" />
                                        </FormControl>
                                    </ModalBody>

                                    <ModalFooter>
                                        <Button colorScheme='cyan' mr={3} onClick={handleProjectCreation}>
                                            Save
                                        </Button>
                                        <Button onClick={onClose}>Cancel</Button>
                                    </ModalFooter>
                                </ModalContent>
                            </Modal>
                        </TabPanel>
                        <TabPanel>
                            <Text color="whiteAlpha.800" mt={2}>Current Plan: FREE</Text>
                            <FormLabel color="whiteAlpha.800" mt={5}>OpenAI API Key</FormLabel>
                            <Input 
                                placeholder="*****" 
                                color="whiteAlpha.600" 
                                colorScheme="cyan"
                                value={userInfo?.openaiAPI}
                                mt={2}
                                onChange={e => {
                                    let prev = {...userInfo}
                                    prev.openaiAPI = e.target.value
                                    setUserInfo(prev)
                                }} />
                                
                            <Button colorScheme="cyan" mt={2} onClick={handleAccountUpdate}>Save</Button>
                        </TabPanel>
                        <TabPanel>
                            <Button colorScheme="cyan" 
                                onClick={() => signOut(auth)}>
                                Log Out
                            </Button>
                        </TabPanel>
                    </TabPanels>
            </Tabs>
        </Container>
    )
}