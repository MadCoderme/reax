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
import { useNavigate } from "react-router-dom"

const MenuItemStyle = {
    bg: 'whiteAlpha.100',
    color: 'whiteAlpha.600',
    _hover: {bg: 'whiteAlpha.200'},
    _active: {bg: 'whiteAlpha.300'}
}

const MenuBar = ({ app, editor, onToggleView, onAction }) => {

    const navigate = useNavigate()

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
                <MenuList bg="black" pt={0} pb={0} borderWidth="0">
                    <MenuItem {...MenuItemStyle} onClick={() => navigate('/dashboard?newProject=true')} pt={2}>New Project</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => navigate('/dashboard')}>Open</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onAction('save')}>Save Current</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onAction('share')}>Share Project</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => navigate('/dashboard')} pb={2}>Go back to Dashboard</MenuItem>
                </MenuList>
            </Menu>
            <Menu>
                <MenuButton as={Button} variant="ghost" 
                    _hover={{bg: 'whiteAlpha.50'}} _active={{bg: 'whiteAlpha.100'}} color="whiteAlpha.500" fontSize="sm">
                    Edit
                </MenuButton>
                <MenuList bg="black" pt={0} pb={0} borderWidth="0">
                    <MenuItem {...MenuItemStyle} pt={2} onClick={() => editor.trigger('my-source', 'undo')}>Undo</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => editor.trigger('my-source', 'redo')}>Redo</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => editor.trigger('my-source', 'actions.find')} pb={2}>Find</MenuItem>
                </MenuList>
            </Menu>
            <Menu>
                <MenuButton as={Button} variant="ghost" 
                    _hover={{bg: 'whiteAlpha.50'}} _active={{bg: 'whiteAlpha.100'}} color="whiteAlpha.500" fontSize="sm">
                    View
                </MenuButton>
                <MenuList bg="black" pt={0} pb={0} borderWidth="0">
                    <MenuItem {...MenuItemStyle} pt={2} onClick={() => onToggleView('preview')}>Preview</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onToggleView('console')}>Console</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onToggleView('git')}>Github Management</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onToggleView('left')}>Left Panel</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onToggleView('right')} pb={2}>Right Panel</MenuItem>
                </MenuList>
            </Menu>
            <Menu>
                <MenuButton as={Button} variant="ghost" 
                    _hover={{bg: 'whiteAlpha.50'}} _active={{bg: 'whiteAlpha.100'}} color="whiteAlpha.500" fontSize="sm">
                    Build
                </MenuButton>
                <MenuList bg="black" pt={0} pb={0} borderWidth="0">
                    <MenuItem {...MenuItemStyle} pt={2} onClick={() => onAction('gitrefresh')}>GIT Refresh</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onAction('gitcommit')}>GIT Commit</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onAction('gitpush')}>GIT Push</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onAction('gitsettings')}>GIT Settings</MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => window.open('https://vercel.com/solutions/react')}>
                        <Text mr={2}>Vercel</Text>
                        <VscLinkExternal color="whiteAlpha.100" fontSize="15" /> 
                    </MenuItem>
                    <MenuItem {...MenuItemStyle} onClick={() => onAction('settings')} pb={2}>Settings</MenuItem>
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