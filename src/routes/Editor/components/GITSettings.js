import React,  { forwardRef, useImperativeHandle, useState, useCallback } from "react"
import {
  Text,
  useDisclosure,
  Grid,
  GridItem,
  Button,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalCloseButton,
  ModalHeader,
  Tab,
  Tabs,
  TabPanel,
  TabPanels,
  TabList,
  Container,
  Input,
  Select,
  Card,
  CardBody,
  useToast,

} from '@chakra-ui/react';
import { useSearchParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { Octokit } from "octokit";

var octokit = null
const GITSettings = forwardRef((prop, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [searchParams, setSearchParams] = useSearchParams()
    const [projectInfo, setProjectInfo] = useState({})
    const [userInfo, setUserInfo] = useState({})
    const toast = useToast()

    useImperativeHandle(ref, () => ({
        open(user) {
            octokit = new Octokit({auth: user.accessToken})
            setUserInfo(user)
            onOpen()
            getDoc(doc(db, 'projects', user.uid))
                .then(docSnap => {
                    let data = docSnap.data()?.list
                    let info = data.find(el => el.id === searchParams.get('app'))
                    setProjectInfo(info)
                })
        }
    }))

    const handleSave = async() => {

        toast({
            title: 'Checking...',
            status: 'loading',
            duration: 2000,
            isClosable: true,
        })


        const {
            data: { login },
        } = await octokit.rest.users.getAuthenticated()

        const { data } = await octokit.rest.repos.getBranch({
            owner: login,
            repo: projectInfo?.repo,
            branch: projectInfo?.branch
        })
        
        if(data) {
            getDoc(doc(db, 'projects', userInfo.uid))
                .then(docSnap => {
                    let prev = docSnap.data()
                    let idx = prev.list.indexOf(prev.list.find(el => el.id === searchParams.get('app')))
                    prev.list[idx] = projectInfo
                    updateDoc(doc(db, 'projects', userInfo.uid), {
                        list: prev.list
                    })
                    .then(() => {
                        toast({
                            title: 'Successfully Updated Branch!',
                            status: 'success',
                            duration: 2000,
                            isClosable: true,
                        })
                        onClose()
                    })
                })
        }
    }

    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.700" height="80%">
            <ModalHeader color="cyan.300">GIT Settings</ModalHeader>
            <ModalCloseButton color="#ababab" />
            <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                <Text color="whiteAlpha.600" fontSize="sm" mb={2}>Project Branch</Text>
                <Input  
                    placeholder="main" 
                    value={projectInfo?.branch}
                    onChange={e => {
                        let prev = {...projectInfo}
                        prev.branch = e.target.value
                        setProjectInfo(prev)
                    }}
                    color="whiteAlpha.700" 
                    colorScheme="cyan"
                    mb={4} />
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='cyan' mr={3} onClick={handleSave}>
                    Save
                </Button>
                <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
})

export default React.memo(GITSettings)