import React from "react"
import { 
    Button,
    Text,
    Menu,
    MenuButton,
    MenuItem,
    MenuList
} from "@chakra-ui/react"
import { SEMI_BACK } from "../../../utils/colors"
import { VscLinkExternal } from "react-icons/vsc"

const MenuBar = ({ app }) => {
    return (
        <div style={{
            flexDirection: 'row',
            backgroundColor: SEMI_BACK,
            padding: 2,
            height: '5%',
            width: '100%'
        }}>
            <Menu>
                <MenuButton as={Button} variant="ghost" 
                    _hover={{bg: 'whiteAlpha.50'}} _active={{bg: 'whiteAlpha.100'}} color="whiteAlpha.500" fontSize="sm">
                    File
                </MenuButton>
                <MenuList>
                    <MenuItem>Download</MenuItem>
                    <MenuItem>Create a Copy</MenuItem>
                    <MenuItem>Mark as Draft</MenuItem>
                    <MenuItem>Delete</MenuItem>
                    <MenuItem>Attend a Workshop</MenuItem>
                </MenuList>
            </Menu>
            <Menu>
                <MenuButton as={Button} variant="ghost" 
                    _hover={{bg: 'whiteAlpha.50'}} _active={{bg: 'whiteAlpha.100'}} color="whiteAlpha.500" fontSize="sm">
                    Edit
                </MenuButton>
                <MenuList>
                    <MenuItem>Download</MenuItem>
                    <MenuItem>Create a Copy</MenuItem>
                    <MenuItem>Mark as Draft</MenuItem>
                    <MenuItem>Delete</MenuItem>
                    <MenuItem>Attend a Workshop</MenuItem>
                </MenuList>
            </Menu>
            <Menu>
                <MenuButton as={Button} variant="ghost" 
                    _hover={{bg: 'whiteAlpha.50'}} _active={{bg: 'whiteAlpha.100'}} color="whiteAlpha.500" fontSize="sm">
                    View
                </MenuButton>
                <MenuList>
                    <MenuItem>Download</MenuItem>
                    <MenuItem>Create a Copy</MenuItem>
                    <MenuItem>Mark as Draft</MenuItem>
                    <MenuItem>Delete</MenuItem>
                    <MenuItem>Attend a Workshop</MenuItem>
                </MenuList>
            </Menu>
            <Menu>
                <MenuButton as={Button} variant="ghost" 
                    _hover={{bg: 'whiteAlpha.50'}} _active={{bg: 'whiteAlpha.100'}} color="whiteAlpha.500" fontSize="sm">
                    Hosting
                </MenuButton>
                <MenuList>
                    <MenuItem>Download</MenuItem>
                    <MenuItem>Create a Copy</MenuItem>
                    <MenuItem>Mark as Draft</MenuItem>
                    <MenuItem>Delete</MenuItem>
                    <MenuItem>Attend a Workshop</MenuItem>
                </MenuList>
            </Menu>

            <Button height="5" position="absolute" right={0} variant="ghost" 
                _hover={{bg: 'whiteAlpha.50'}} _active={{bg: 'whiteAlpha.100'}}
                onClick={() => window.open('/apps/' + app)}>
                <Text color="red.500" mr={2}>Test Live </Text> <VscLinkExternal color="red" />
            </Button>
        </div>
    )
}

export default React.memo(MenuBar)