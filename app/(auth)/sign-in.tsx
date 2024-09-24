import { useCallback, useState, useRef } from "react"
import { Alert, Image, Text, View } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { TextInput } from "react-native-gesture-handler"
import { Link, router } from "expo-router"
import { useSignIn } from "@clerk/clerk-expo"

import CustomButton from "@/components/CustomButton"
import InputField from "@/components/InputField"
import OAuth from "@/components/OAuth"
import { icons, images } from "@/constants"

const SignIn = () => {
  const emailInputRef = useRef<TextInput>(null)
  const passwordInputRef = useRef<TextInput>(null)

  const { signIn, setActive, isLoaded } = useSignIn()

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      })

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId })
        router.push("/(root)/(tabs)/home")
      } else {
        // See https://clerk.com/docs/custom-flows/error-handling for more info on error handling
        console.log(
          "Sign in not complete:",
          JSON.stringify(signInAttempt, null, 2)
        )
        Alert.alert("Error", "Log in failed. Please try again.")
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2))
      Alert.alert("Error", err.errors[0].longMessage)
    }
  }, [isLoaded, signIn, form.email, form.password, setActive])

  const handleSubmitEditing = (nextInputRef: React.RefObject<TextInput>) => {
    nextInputRef.current?.focus()
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      keyboardOpeningTime={0}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-3xl text-white font-JakartaBold absolute bottom-28 left-5">
            Bienvenid@ 👋
          </Text>
        </View>

        <View className="p-5">
          <InputField
            ref={emailInputRef}
            label="Correo electrónico"
            placeholder="Ingrese su correo electrónico"
            icon={icons.email}
            textContentType="emailAddress"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => handleSubmitEditing(passwordInputRef)}
          />

          <InputField
            ref={passwordInputRef}
            label="Contraseña"
            placeholder="Ingrese su contraseña"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
            onSubmitEditing={() => passwordInputRef.current?.blur()}
          />

          <CustomButton
            title="Iniciar Sesión"
            onPress={onSignInPress}
            className="mt-6"
          />

          <OAuth />

          <Link
            href="/sign-up"
            className="text-lg text-center text-general-200 mt-10"
          >
            ¿No tienes cuenta?{" "}
            <Text className="text-primary-500">Registrarse</Text>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollView>
  )
}

export default SignIn
