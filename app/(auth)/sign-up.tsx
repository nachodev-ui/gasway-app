import { useState, useRef, useEffect } from "react"
import { Alert, Image, Text, View } from "react-native"
import { ReactNativeModal } from "react-native-modal"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { TextInput } from "react-native-gesture-handler"
import { Link, router } from "expo-router"
import { useSignUp } from "@clerk/clerk-expo"

import CustomButton from "@/components/CustomButton"
import InputField from "@/components/InputField"
import OAuth from "@/components/OAuth"
import { icons, images } from "@/constants"
import { fetchAPI } from "@/lib/fetch"

const SignUp = () => {
  const nameInputRef = useRef<TextInput>(null)
  const emailInputRef = useRef<TextInput>(null)
  const passwordInputRef = useRef<TextInput>(null)

  const { isLoaded, signUp, setActive } = useSignUp()

  const [isFirstModalVisible, setFirstModalVisible] = useState(false) // Primer modal
  const [isSecondModalVisible, setSecondModalVisible] = useState(false) // Segundo modal

  const toggleFirstModal = () => {
    setFirstModalVisible(!isFirstModalVisible)
  }

  const showSecondModal = () => {
    setSecondModalVisible(true)
  }

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  })

  const onSignUpPress = async () => {
    if (!isLoaded) return
    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      })
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setVerification({ ...verification, state: "pending" })
      toggleFirstModal()
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2))
      Alert.alert("Error", err.errors[0].longMessage)
    }
  }

  const onPressVerify = async () => {
    if (!isLoaded) return
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      })

      if (completeSignUp.status === "complete") {
        await fetchAPI("/(api)/user", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: completeSignUp.createdUserId,
          }),
        })
        await setActive({ session: completeSignUp.createdSessionId })
        setVerification((prev) => ({ ...prev, state: "verified" }))
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        })
      }
    } catch (err: any) {
      console.log("Error during verification", err)
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      })
    }
  }

  const handleSubmitEditing = (nextInputRef: React.RefObject<TextInput>) => {
    nextInputRef.current?.focus()
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      keyboardOpeningTime={0}
    >
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-3xl text-white font-JakartaBold absolute bottom-28 left-5">
            Crea una Cuenta
          </Text>
        </View>
        <View className="p-5">
          <InputField
            ref={nameInputRef}
            label="Nombre"
            placeholder="Ingrese su nombre"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) => setForm({ ...form, name: value })}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => handleSubmitEditing(emailInputRef)}
          />
          <InputField
            ref={emailInputRef}
            label="Correo electrónico"
            placeholder="Ingrese su correo electrónico"
            icon={icons.email}
            textContentType="emailAddress"
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
            returnKeyType="done"
            onSubmitEditing={() => passwordInputRef.current?.blur()}
          />
          <CustomButton
            title="Crear Cuenta"
            onPress={onSignUpPress}
            className="mt-6"
          />
          <OAuth />
          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-5"
          >
            ¿Ya tienes una cuenta?{" "}
            <Text className="text-primary-500">Iniciar Sesión</Text>
          </Link>
        </View>
        <ReactNativeModal
          isVisible={verification.state === "pending"}
          onModalHide={showSecondModal}
          onBackdropPress={() => setFirstModalVisible(false)}
        >
          <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            enableOnAndroid={true}
            extraScrollHeight={80}
            keyboardOpeningTime={0}
          >
            <View className="bg-white px-7 py-9 rounded-2xl min-h-[350px]">
              <Text className="font-JakartaExtraBold text-2xl mb-2">
                Verificación
              </Text>
              <Text className="font-Jakarta mb-5">
                Hemos enviado un código de verificación a su correo electrónico{" "}
                <Text className="text-blue-500 font-JakartaSemiBold">
                  {form.email}
                </Text>
                . Por favor, ingrese el código a continuación.
              </Text>
              <InputField
                label={"Código"}
                icon={icons.lock}
                placeholder={"12345"}
                value={verification.code}
                keyboardType="numeric"
                onChangeText={(code) =>
                  setVerification({ ...verification, code })
                }
              />
              {verification.error && (
                <Text className="text-red-500 text-sm mt-1">
                  {verification.error}
                </Text>
              )}
              <CustomButton
                title="Verificar Correo"
                onPress={() => {
                  onPressVerify()
                  setFirstModalVisible(false)
                }}
                className="mt-5"
              />
            </View>
          </KeyboardAwareScrollView>
        </ReactNativeModal>

        <ReactNativeModal isVisible={isSecondModalVisible}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[200px]">
            <Text className="font-JakartaExtraBold text-2xl mb-2">
              ¡Registro Exitoso!
            </Text>
            <Text className="font-Jakarta">
              Su cuenta ha sido creada exitosamente. Ahora puede iniciar sesión
              con su correo electrónico y contraseña.
            </Text>
            <CustomButton
              title="Ir al Inicio"
              onPress={() => {
                router.push("/home")
                setSecondModalVisible(false)
              }}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </View>
    </KeyboardAwareScrollView>
  )
}
export default SignUp
