import React from "react";
import { Box, Button, ButtonGroup, Card, CardBody, Container, Image, SimpleGrid, Text } from "@chakra-ui/react";
import { SEMI_BACK } from "../../utils/colors";
import { VscCircleFilled, VscCombine, VscDebugRerun, 
    VscEditorLayout, VscGlobe, VscRocket, VscSymbolEvent } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate()

    const InfoBox = ({title, description, Icon}) => (
        <Card mt={20} bg="blackAlpha.500" borderRadius={10} h="30vh" maxW={300} minHeight="200px" p={3}>
            <CardBody display="flex" flexDir="column" justifyContent="space-between">
                <Text color="whiteAlpha.600" fontSize={23}>
                    <Icon style={{display: 'inline-block'}} /> {title}
                </Text>
                <Text color="whiteAlpha.500" mt={2}>
                    {description}
                </Text>
            </CardBody>
        </Card>
    )

    return (
        <Container minWidth="99vw" minHeight="100vh" pb={50} overflowX="hidden" background={SEMI_BACK}>
            <Box height="100%" width="100%" display="flex" flexDirection="column" alignItems="center" overflowX="hidden">
                <Image 
                    src="blurredGradient.png"
                    loading="lazy"
                    width="800px"
                    background="rgba(255,255,255,0.03)"
                    position="absolute"
                    top={250} />

                <Text color="cyan" zIndex={5} fontSize={50} fontWeight="bold" mt="12%">Retask</Text>
                <Text color="white" zIndex={5} fontSize={30}>Figma for React.JS</Text>

                <ButtonGroup spacing='6'  mt={20} zIndex={5}>
                    <Button colorScheme="cyan" onClick={() => navigate('/dashboard')}>
                        Get Started
                    </Button>
                    <Button colorScheme="blackAlpha" onClick={() => window.location.href = "#details"}>
                        Learn More
                    </Button>
                </ButtonGroup>

                <Text color="whiteAlpha.800" zIndex={5} mt={5}>
                    Build <VscCircleFilled style={{display: 'inline-block'}} /> 
                    {' '} Collaborate <VscCircleFilled style={{display: 'inline-block'}} /> 
                    {' '} Share <VscCircleFilled style={{display: 'inline-block'}} /> 
                    {' '} Rapidly
                </Text>

                <Text color="whiteAlpha.900" fontSize={28} mt="20vh" mb={2} fontWeight="bold" zIndex={5} id="details">
                   <VscRocket style={{display: 'inline-block'}} /> React Taken to Another Level
                </Text>

                <SimpleGrid columns={{sm: 1, md: 3, lg: 4}} spacing={10} >
                    <InfoBox title="Build Fast" description="Create React Apps under 10s, Start Testing within 20"
                        Icon={VscSymbolEvent} />

                    <InfoBox 
                        title="Realtime Collaboration" 
                        description="Work with your teammates in realtime all together, always in sync"
                        Icon={VscCombine} />

                    <InfoBox title="Test & Deploy" description="Test your Apps Instantly with your team and testers"
                        Icon={VscDebugRerun} />

                    <InfoBox title="Manage Smartly" description="UI Tools to set up Apps in a faster and smarter way"
                        Icon={VscEditorLayout} />

                    <InfoBox title="Powerful Online IDE" description="Store & Manage your Projects online without headache"
                        Icon={VscGlobe} />
                </SimpleGrid>
                
                <Image 
                    src="blurredGradient1.png"
                    loading="lazy"
                    width="500px"
                    right="-10%"
                    background="rgba(255,255,255,0.03)"
                    top="-150px"
                    pos="relative" />

                <Box pos="relative" top="-250px" display="flex" flexDir="column" alignItems="center">
                    <Text color="white" fontSize={22} fontWeight="bold">
                        <span style={{color: 'cyan'}}>Build</span> your Next React App with Retask
                    </Text>
                    <Button colorScheme="cyan" variant="outline" mt={5} onClick={() => navigate('/dashboard')}>
                        Start Now
                    </Button>
                </Box>
                

            </Box>
        </Container>
    )
}