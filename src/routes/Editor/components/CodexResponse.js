import React,  { forwardRef, useImperativeHandle } from "react"
import {
  useDisclosure,
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useToast,

} from '@chakra-ui/react';


const CodexResponse = forwardRef((prop, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()

    useImperativeHandle(ref, () => ({
        open(response) {
            onOpen()
            setTimeout(() => {
                document.getElementById('response-view').innerHTML = response
            }, 500)
        }
    }))


    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={onClose}
            bg="gray.700"
        >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.700">
            <AlertDialogHeader fontSize='lg' fontWeight='bold' color="whiteAlpha.700">
              Codex Response
            </AlertDialogHeader>

            <AlertDialogBody id="response-view" color="whiteAlpha.800">
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose} colorScheme="black">
                Okay
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    )
})

export default React.memo(CodexResponse)