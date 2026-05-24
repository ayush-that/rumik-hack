import { Button, Head, Body, Tailwind, pixelBasedPreset, Container, Text } from "@react-email/components";

export default function WelcomeEmail({ name = "Ayush" }: { name: string }) {
  return (
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
        theme: {
          extend: {
            colors: {
              brand: "#007291",
            },
          },
        },
      }}
    >
      <Head />
      <Body>
        <Container className="mx-auto py-5 pb-12">
          <Text className="text-center font-sans font-bold text-4xl tracking-tighter py-5">
            Welcome to Cyrux
          </Text>
          <Text className="font-sans text-xl tracking-tight">
            Hi {name},
          </Text>
          <Text className="font-sans text-xl tracking-tight">
            Welcome to cyrux community, the production ready nexjs-convex template with auth, database and payment integration already covered for you.
          </Text>
          <Text className="font-sans text-xl tracking-tight">
            You can get started by reading the docs.
          </Text>
          <Button
            href="https://example.com"
            className="bg-black tracking-tight text-white px-4 py-2 rounded font-sans"
          >
            Docs
          </Button>
          <Text className="font-sans mt-10 text-xl tracking-tight">
            Best, <br />
            Ayush (cyrux.in)
          </Text>
        </Container>
      </Body>
    </Tailwind>
  );
}
