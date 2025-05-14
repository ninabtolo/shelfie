import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  colors: {
    brand: {
      100: "#FFF5F7", // lightest pink
      200: "#FED7E2", // light pink
      300: "#FBB6CE", // medium pink
      400: "#F687B3", // darker pink
      500: "#ED64A6", // accent pink
      600: "#D53F8C", // deep pink
    },
    bookBrown: {
      100: "#EDE0D4", // light book paper
      200: "#E6CCB2", // medium book paper
      300: "#DDB892", // dark book paper
      400: "#B08968", // book leather
    }
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Lato', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "brand.100",
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "bold",
        borderRadius: "full",
      },
      variants: {
        solid: {
          bg: "brand.500",
          color: "white",
          _hover: {
            bg: "brand.600",
          },
        },
      },
    },
  },
});
