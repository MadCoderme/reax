import React, { forwardRef, useImperativeHandle, useState } from "react"
import {
    Button,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    useDisclosure
} from '@chakra-ui/react'

export default forwardRef(function ConfirmationDialog({ title, description, type, onAction }, ref) {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const cancelRef = React.useRef()
    const [actionData, setActionData] = useState(null)
    
    useImperativeHandle(ref, () => ({
        open(data) {
            onOpen()
            setActionData(data)
        }
    }))

    return (
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent background="gray.800">
              <AlertDialogHeader fontSize='lg' fontWeight='bold' color="whiteAlpha.800">
                {title}
              </AlertDialogHeader>
  
              <AlertDialogBody color="whiteAlpha.700">
                {description}
              </AlertDialogBody>
  
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose} colorScheme="gray">
                  Cancel
                </Button>
                <Button colorScheme={type === 'delete' ? 'red' : 'green'} onClick={() => {
                    onClose()
                    onAction(actionData)
                }} ml={3}>
                  {type === 'delete' ? 'Delete': 'Okay'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
    )
})