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
import { VscTrash } from "react-icons/vsc";

var octokit = null
const Settings = forwardRef((prop, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [searchParams, setSearchParams] = useSearchParams()
    const [projectInfo, setProjectInfo] = useState({})
    const [userInfo, setUserInfo] = useState({})
    const toast = useToast()

    useImperativeHandle(ref, () => ({
        open(user) {
            setUserInfo(user)
            octokit = new Octokit({auth: user.accessToken})
            onOpen()
            getDoc(doc(db, 'projects', user.uid))
                .then(docSnap => {
                    let data = docSnap.data()?.list
                    let info = data.find(el => el.id === searchParams.get('app'))
                    setProjectInfo(info)
                })
        }
    }))

    const handleAdd = async() => {
        octokit.rest.users.getByUsername({
            username: document.getElementById('name-input').value
        })
        .then(({data}) => {
            if(data) {
                let prev = {...projectInfo}
                if(prev.users) prev.users.push(document.getElementById('name-input').value)
                else prev.users = [document.getElementById('name-input').value]
                setProjectInfo(prev)
                update(prev)
            }
        })
        .catch(e => {
            toast({
                title: 'User not found',
                status: 'error',
                duration: 2000,
                isClosable: true,
            })
        })
    }

    const handleRemove = (idx) => {
        let prev = {...projectInfo}
        prev.users.splice(idx, 1)
        setProjectInfo(prev)
        update(prev)
    }

    const update = (newData) => {
        getDoc(doc(db, 'projects', userInfo.uid))
                .then(docSnap => {
                    let pre = docSnap.data()
                    let idx = pre.list.indexOf(pre.list.find(el => el.id === searchParams.get('app')))
                    pre.list[idx] = newData
                    updateDoc(doc(db, 'projects', userInfo.uid), {
                        list: pre.list
                    })
                    .then(() => {
                        toast({
                            title: 'Successfully Updated Settings!',
                            status: 'success',
                            duration: 2000,
                            isClosable: true,
                        })
                        onClose()
                    })
                })
    }

    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.700" height="80%">
                <ModalHeader color="cyan.300">Settings</ModalHeader>
                <ModalCloseButton color="#ababab" />
                <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>People with Access</Text>
                    <Input  
                        id="name-input"
                        placeholder="@Github Username" 
                        color="whiteAlpha.700" 
                        colorScheme="cyan"
                        mt={3} />
                    <Button colorScheme="cyan" mt={2} mb={5} onClick={handleAdd}>Add</Button>

                    {projectInfo?.users?.length > 0 ?
                        projectInfo?.users.map((i, v) => (
                            <Text color="whiteAlpha.800" size="lg" mb={2} ml={2}>
                                {v+1}. @{i} 
                                <Button colorScheme={'red'} size="s" p={1} ml={3} variant="ghost"
                                    _hover={{background: 'whiteAlpha.200'}} _active={{background: 'whiteAlpha.200'}}
                                    onClick={() => handleRemove(v)}>
                                    <VscTrash />
                                </Button>
                            </Text>
                        )) : null}
                </ModalBody>

                <ModalFooter>
                    {/* <Button colorScheme='cyan' mr={3} onClick={handleSave}>
                        Save
                    </Button> */}
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
})

export default React.memo(Settings)